import type { ClientSession } from "mongoose";
import { Match } from "../models/Match.js";
import { Tournament } from "../models/Tournament.js";
import { Pair } from "../models/Pair.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { TournamentRegistration } from "../models/TournamentRegistration.js";
import { Lineup } from "../models/Lineup.js";
import type { MatchPhase } from "../models/enums.js";
import { AppError } from "../lib/errors.js";

interface BasePoints {
  participation: number;
  win: number;
}

const BASE_POINTS: Record<MatchPhase, BasePoints> = {
  QUALIFICATION: { participation: 2, win: 1 },
  POOL: { participation: 3, win: 2 },
  MAIN_R12: { participation: 5, win: 3 },
  MAIN_QF: { participation: 7, win: 4 },
  MAIN_SF: { participation: 10, win: 5 },
  MAIN_FINAL: { participation: 15, win: 7 },
  MAIN_3RD: { participation: 10, win: 5 },
};

export async function applyMatchResult(
  matchId: string,
  session: ClientSession,
): Promise<void> {
  const match = await Match.findById(matchId).session(session);
  if (!match) throw new AppError("NOT_FOUND", "Match not found");
  if (!match.isCompleted || match.scoringDone) return;

  const tournament = await Tournament.findById(match.tournamentId)
    .session(session)
    .lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  const [homePair, awayPair] = await Promise.all([
    Pair.findById(match.homePairId).session(session).lean(),
    Pair.findById(match.awayPairId).session(session).lean(),
  ]);

  if (!homePair || !awayPair) {
    throw new AppError("UNPROCESSABLE", "Match pairs not found");
  }

  const base = BASE_POINTS[match.phase as MatchPhase];
  const playedAt = match.playedAt ?? new Date();

  const isHomeWin = String(match.winnerId) === String(match.homePairId);
  const bonus2_0 = tournament.bonusWin2_0 ?? 3;
  const bonus2_1 = tournament.bonusWin2_1 ?? 1;
  const matchResult = match.result!;
  const isStraightSets = matchResult === "2_0" || matchResult === "0_2";
  const bonusPoints = isStraightSets ? bonus2_0 : bonus2_1;

  const scoreDocs = [
    // Home pair players
    {
      playerId: homePair.player1Id,
      pairId: homePair._id,
      isWin: isHomeWin,
      basePoints: isHomeWin
        ? base.participation + base.win
        : base.participation,
      bonusPoints: isHomeWin ? bonusPoints : 0,
    },
    {
      playerId: homePair.player2Id,
      pairId: homePair._id,
      isWin: isHomeWin,
      basePoints: isHomeWin
        ? base.participation + base.win
        : base.participation,
      bonusPoints: isHomeWin ? bonusPoints : 0,
    },
    // Away pair players
    {
      playerId: awayPair.player1Id,
      pairId: awayPair._id,
      isWin: !isHomeWin,
      basePoints: !isHomeWin
        ? base.participation + base.win
        : base.participation,
      bonusPoints: !isHomeWin ? bonusPoints : 0,
    },
    {
      playerId: awayPair.player2Id,
      pairId: awayPair._id,
      isWin: !isHomeWin,
      basePoints: !isHomeWin
        ? base.participation + base.win
        : base.participation,
      bonusPoints: !isHomeWin ? bonusPoints : 0,
    },
  ].map((d) => ({
    ...d,
    tournamentId: match.tournamentId,
    matchId: match._id,
    totalPoints: d.basePoints + d.bonusPoints,
    matchResult,
    phase: match.phase,
    playedAt,
  }));

  await PlayerScore.insertMany(scoreDocs, { session });
  await Match.updateOne({ _id: match._id }, { scoringDone: true }, { session });
}

interface ScoreBreakdownEntry {
  playerId: string;
  role: "starter" | "reserve";
  scores: { matchId: string; phase: string; totalPoints: number }[];
  totalPoints: number;
  substitutedFor?: string;
  absent?: boolean;
}

interface UserTournamentScore {
  total: number;
  breakdown: ScoreBreakdownEntry[];
  substitutions: { originalStarter: string; usedReserve: string }[];
  registeredAt: Date | null;
  hasLineup: boolean;
}

export async function computeUserTournamentScore(
  userId: string,
  tournamentId: string,
): Promise<UserTournamentScore> {
  const registration = await TournamentRegistration.findOne({
    userId,
    tournamentId,
  }).lean();

  if (!registration) {
    return {
      total: 0,
      breakdown: [],
      substitutions: [],
      registeredAt: null,
      hasLineup: false,
    };
  }

  const { registeredAt } = registration;

  const lineup = await Lineup.findOne({ userId, tournamentId }).lean();
  if (!lineup || lineup.starters.length === 0) {
    return {
      total: 0,
      breakdown: [],
      substitutions: [],
      registeredAt,
      hasLineup: false,
    };
  }

  // Load all relevant PlayerScores for this tournament since registration
  const allScores = await PlayerScore.find({
    tournamentId,
    playedAt: { $gte: registeredAt },
  }).lean();

  // Group by playerId for fast lookup
  const scoresByPlayer = new Map<
    string,
    { matchId: string; phase: string; totalPoints: number }[]
  >();
  for (const s of allScores) {
    const pid = String(s.playerId);
    if (!scoresByPlayer.has(pid)) scoresByPlayer.set(pid, []);
    scoresByPlayer.get(pid)!.push({
      matchId: String(s.matchId),
      phase: s.phase,
      totalPoints: s.totalPoints,
    });
  }

  const breakdown: ScoreBreakdownEntry[] = [];
  const substitutions: { originalStarter: string; usedReserve: string }[] = [];
  let reserveIndex = 0;
  let total = 0;

  for (const starterId of lineup.starters) {
    const sid = String(starterId);
    const starterScores = scoresByPlayer.get(sid) ?? [];

    if (starterScores.length > 0) {
      const pts = starterScores.reduce((sum, s) => sum + s.totalPoints, 0);
      total += pts;
      breakdown.push({
        playerId: sid,
        role: "starter",
        scores: starterScores,
        totalPoints: pts,
      });
    } else {
      // Try to substitute with the next available reserve
      let substituted = false;
      while (reserveIndex < lineup.reserves.length && !substituted) {
        const reserveId = String(lineup.reserves[reserveIndex]);
        reserveIndex++;
        const reserveScores = scoresByPlayer.get(reserveId) ?? [];
        if (reserveScores.length > 0) {
          const pts = reserveScores.reduce((sum, s) => sum + s.totalPoints, 0);
          total += pts;
          breakdown.push({
            playerId: reserveId,
            role: "reserve",
            scores: reserveScores,
            totalPoints: pts,
            substitutedFor: sid,
          });
          substitutions.push({ originalStarter: sid, usedReserve: reserveId });
          substituted = true;
        }
      }

      if (!substituted) {
        breakdown.push({
          playerId: sid,
          role: "starter",
          scores: [],
          totalPoints: 0,
          absent: true,
        });
      }
    }
  }

  return { total, breakdown, substitutions, registeredAt, hasLineup: true };
}

export async function getTournamentPlayerScores(tournamentId: string) {
  const scores = await PlayerScore.find({ tournamentId })
    .populate("playerId", "firstName lastName")
    .populate("matchId", "phase bracketSlot poolRound scheduledAt")
    .lean();
  return scores;
}
