import mongoose, { type ClientSession } from "mongoose";
import { Match } from "../models/Match.js";
import { Tournament } from "../models/Tournament.js";
import { Pair } from "../models/Pair.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { Lineup } from "../models/Lineup.js";
import { Team } from "../models/Team.js";
import { League } from "../models/League.js";
import { LeagueMember } from "../models/LeagueMember.js";
import { AuditLog, AuditLogType } from "../models/AuditLog.js";
import { MatchPhase, MatchResult } from "../models/enums.js";
import { AppError } from "../lib/errors.js";
import { computeMatchPoints } from "../scoring/engine.js";
import type { ScoringTable } from "../scoring/engine.js";
import { withMongoTransaction } from "../lib/tx.js";
import { resolveSlot } from "./brackets.service.js";
import type { Types } from "mongoose";

export interface LineupDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  starters: Types.ObjectId[];
  reserves: Types.ObjectId[];
}

export interface PlayerScoreAggregate {
  playerId: Types.ObjectId;
  totalPoints: number;
}

/**
 * Compute fantasy points for a lineup with auto-substitution: if a starter has no
 * points in the eligible score map, substitute the first unused reserve (in order) that has points.
 */
export function computeFantasyTeamPoints(
  lineup: LineupDoc,
  playerIdToPoints: Map<string, number>,
): number {
  const starterIds = lineup.starters.map((id) => id.toString());
  const reserveIds = lineup.reserves.map((id) => id.toString());

  const effective: string[] = [];
  const usedReserves = new Set<string>();

  for (const sid of starterIds) {
    const points = playerIdToPoints.get(sid) ?? 0;
    if (points > 0) {
      effective.push(sid);
    } else {
      let subbed = false;
      for (const rid of reserveIds) {
        if (usedReserves.has(rid)) continue;
        const rPoints = playerIdToPoints.get(rid) ?? 0;
        if (rPoints > 0) {
          effective.push(rid);
          usedReserves.add(rid);
          subbed = true;
          break;
        }
      }
      if (!subbed) effective.push(sid); // no sub available, count 0
    }
  }

  return effective.reduce(
    (sum, id) => sum + (playerIdToPoints.get(id) ?? 0),
    0,
  );
}

/**
 * Recompute all lineups for a tournament, enforcing anti-retroactive scoring:
 * only PlayerScore records with playedAt >= team.registeredAt are counted for each lineup.
 * Returns the count of lineups updated.
 */
export async function recomputeLineupsForTournament(
  tournamentId: string,
  session?: ClientSession,
): Promise<number> {
  const opts = session ? { session } : {};

  // Fetch all PlayerScore records for the tournament (with playedAt for date filtering)
  const scores = await PlayerScore.find({ tournamentId }, null, opts).lean();

  // Fetch all lineups for the tournament
  const lineups = (await Lineup.find(
    { tournamentId },
    null,
    opts,
  ).lean()) as LineupDoc[];

  let affectedCount = 0;
  for (const lineup of lineups) {
    // Find the team to get registeredAt (anti-retroactive anchor, §21)
    const team = await Team.findOne(
      { userId: lineup.userId, tournamentId },
      { registeredAt: 1 },
      opts,
    ).lean();
    const registeredAt = team?.registeredAt ? new Date(team.registeredAt) : new Date(0);

    // Only include scores for matches played at or after registration
    const eligibleScores = scores.filter((s) => {
      if (!s.playedAt) return false;
      return new Date(s.playedAt) >= registeredAt;
    });

    const playerIdToPoints = new Map<string, number>();
    for (const s of eligibleScores) {
      const id = s.playerId.toString();
      playerIdToPoints.set(id, (playerIdToPoints.get(id) ?? 0) + s.totalPoints);
    }

    const totalPoints = computeFantasyTeamPoints(lineup, playerIdToPoints);
    await Lineup.updateOne(
      { _id: lineup._id },
      { $set: { totalPoints } },
      opts,
    );
    affectedCount++;
  }

  return affectedCount;
}

async function updateLeagueMemberPoints(
  leagues: Array<{ _id: Types.ObjectId }>,
  tournamentId: string,
  opts: { session: ClientSession },
): Promise<string[]> {
  const leagueIds: string[] = [];
  for (const league of leagues) {
    const members = await LeagueMember.find(
      { leagueId: league._id },
      { userId: 1 },
      opts,
    ).lean();
    for (const member of members) {
      const lineup = await Lineup.findOne(
        { userId: member.userId, tournamentId },
        { totalPoints: 1 },
        opts,
      ).lean();
      const totalPoints = lineup?.totalPoints ?? 0;
      await LeagueMember.updateOne(
        { _id: member._id },
        { $set: { totalPoints } },
        opts,
      );
    }
    leagueIds.push(league._id.toString());
  }
  return leagueIds;
}

export interface OnMatchUpdatedResult {
  leagueIds: string[];
  matchInfo?: {
    matchId: string;
    sets: Array<{ home: number; away: number }>;
    result: string;
  };
  playerIds?: string[];
  tournamentId?: string;
}

export async function onMatchUpdated(
  matchId: string,
  tournamentId: string,
  versionNumber: number,
): Promise<OnMatchUpdatedResult> {
  return withMongoTransaction(async (session) => {
    const opts = { session };
    const match = await Match.findById(matchId, null, opts);
    if (!match) throw new AppError("NOT_FOUND", "Match not found");
    if (match.versionNumber !== versionNumber) return { leagueIds: [] }; // idempotency
    if (match.scoringDone) return { leagueIds: [] }; // prevent double-scoring

    const tournament = await Tournament.findById(tournamentId, null, opts);
    if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
    const scoringTable: ScoringTable = { ...tournament.scoringTable };

    const winnerId = match.winnerId;
    const loserId = match.loserId;
    if (!winnerId || !loserId || !match.result) {
      return { leagueIds: [] };
    }

    const [winnerPair, loserPair] = await Promise.all([
      Pair.findById(winnerId, null, opts).lean(),
      Pair.findById(loserId, null, opts).lean(),
    ]);
    if (!winnerPair || !loserPair) throw new AppError("NOT_FOUND", "Pair not found");

    const winnerPlayerIds = [
      winnerPair.player1Id.toString(),
      winnerPair.player2Id.toString(),
    ];
    const loserPlayerIds = [
      loserPair.player1Id.toString(),
      loserPair.player2Id.toString(),
    ];

    const outputs = computeMatchPoints({
      phase: match.phase as MatchPhase,
      result: match.result as MatchResult,
      winnerPlayerIds,
      loserPlayerIds,
      scoringTable,
    });

    const matchObjId = match._id;
    const playedAt = match.playedAt ?? match.scheduledAt;

    for (const out of outputs) {
      const playerObjId = new mongoose.Types.ObjectId(out.playerId);
      await PlayerScore.updateOne(
        { matchId: matchObjId, playerId: playerObjId },
        {
          $set: {
            tournamentId: new mongoose.Types.ObjectId(tournamentId),
            matchId: matchObjId,
            playerId: playerObjId,
            pairId: out.isWin ? winnerId : loserId,
            basePoints: out.basePoints,
            bonusPoints: out.bonusPoints,
            totalPoints: out.totalPoints,
            isWin: out.isWin,
            matchResult: match.result,
            phase: match.phase,
            playedAt,
          },
        },
        { ...opts, upsert: true },
      );
    }

    await Match.updateOne(
      { _id: matchId },
      { $set: { scoringDone: true } },
      opts,
    );

    // Advance bracket: wire winner/loser into next slot(s) — same transaction
    await resolveSlot(
      {
        _id: match._id,
        tournamentId: match.tournamentId,
        bracketSlot: match.bracketSlot,
        winnerId: match.winnerId,
        loserId: match.loserId,
      },
      session,
    );

    // Recompute all lineups with anti-retroactive scoring filter
    const affectedLineups = await recomputeLineupsForTournament(
      tournamentId,
      session,
    );

    const leagues = await League.find(
      { tournamentId },
      { _id: 1 },
      opts,
    ).lean();
    const leagueIds = await updateLeagueMemberPoints(leagues, tournamentId, opts);

    // Write audit log (inside transaction so it rolls back on failure)
    await AuditLog.create(
      [
        {
          type: AuditLogType.RECOMPUTE_RUN,
          entity: "Match",
          entityId: match._id,
          tournamentId: new mongoose.Types.ObjectId(tournamentId),
          by: "system",
          meta: { affectedLineups, versionNumber },
        },
      ],
      opts,
    );

    return {
      leagueIds,
      matchInfo: {
        matchId: match._id.toString(),
        sets: match.sets ?? [],
        result: match.result ?? "",
      },
      playerIds: [...winnerPlayerIds, ...loserPlayerIds],
      tournamentId,
    };
  });
}
