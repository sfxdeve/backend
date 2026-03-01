import mongoose from "mongoose";
import { Match, Tournament } from "../models/RealWorld.js";
import { AthleteMatchPoints } from "../models/Scoring.js";
import { Athlete, TournamentPair } from "../models/RealWorld.js";
import {
  Lineup,
  LineupSlot,
  FantasyTeam,
  GameweekStanding,
  LeagueMembership,
} from "../models/Fantasy.js";
import { League } from "../models/Fantasy.js";
import { LineupRole, LeagueStatus } from "../models/enums.js";
import { computeMatchPoints } from "./engine.js";
import { logger } from "../lib/logger.js";

/**
 * Full recomputation cascade triggered whenever a match transitions to
 * COMPLETED or CORRECTED.
 *
 * Steps (in order):
 *  1. Resolve pair → athletes
 *  2. Compute and upsert AthleteMatchPoints for all 4 athletes
 *  3. Update Athlete.averageFantasyScore (running avg across all tournaments)
 *  4. Update LineupSlot.pointsScored for STARTER slots referencing affected athletes
 *  5. Recalculate FantasyTeam.totalPoints from all STARTER slot scores in all lineups
 *  6. Upsert GameweekStanding and re-rank within each affected league
 */
export async function runCascade(matchId: string): Promise<void> {
  const match = await Match.findById(matchId).lean();
  if (!match) {
    logger.warn({ matchId }, "Cascade: match not found");
    return;
  }

  // ── Step 1: Resolve athletes from pairs ──────────────────────
  const [pairA, pairB] = await Promise.all([
    TournamentPair.findById(match.pairAId).lean(),
    TournamentPair.findById(match.pairBId).lean(),
  ]);

  if (!pairA || !pairB) {
    logger.warn({ matchId }, "Cascade: pairs not found");
    return;
  }

  const athleteIdsA = [String(pairA.athleteAId), String(pairA.athleteBId)];
  const athleteIdsB = [String(pairB.athleteAId), String(pairB.athleteBId)];
  const allAthleteIds = [...athleteIdsA, ...athleteIdsB];

  if (!match.winnerPairId) {
    logger.warn({ matchId }, "Cascade: no winner set, skipping");
    return;
  }
  const winnerIsA =
    String(match.winnerPairId) === String(match.pairAId) ? "A" : "B";

  // ── Step 2: Compute and upsert AthleteMatchPoints ────────────
  const result = computeMatchPoints({
    round: match.round,
    set1A: match.set1A ?? 0,
    set1B: match.set1B ?? 0,
    set2A: match.set2A ?? 0,
    set2B: match.set2B ?? 0,
    set3A: match.set3A,
    set3B: match.set3B,
    winnerPairId: winnerIsA,
    isRetirement: match.isRetirement,
  });

  const upsertOps = [
    ...athleteIdsA.map((athleteId) => ({
      updateOne: {
        filter: { matchId: match._id, athleteId },
        update: {
          $set: {
            tournamentId: match.tournamentId,
            basePoints: result.pairA.basePoints,
            bonusPoints: result.pairA.bonusPoints,
            totalPoints: result.pairA.totalPoints,
          },
        },
        upsert: true,
      },
    })),
    ...athleteIdsB.map((athleteId) => ({
      updateOne: {
        filter: { matchId: match._id, athleteId },
        update: {
          $set: {
            tournamentId: match.tournamentId,
            basePoints: result.pairB.basePoints,
            bonusPoints: result.pairB.bonusPoints,
            totalPoints: result.pairB.totalPoints,
          },
        },
        upsert: true,
      },
    })),
  ];

  await AthleteMatchPoints.bulkWrite(upsertOps);

  // ── Step 3: Update averageFantasyScore for each athlete ──────
  for (const athleteId of allAthleteIds) {
    const agg = await AthleteMatchPoints.aggregate([
      { $match: { athleteId: new mongoose.Types.ObjectId(athleteId) } },
      { $group: { _id: null, avg: { $avg: "$totalPoints" } } },
    ]);
    const avg = agg[0]?.avg ?? 0;
    await Athlete.updateOne(
      { _id: athleteId },
      { $set: { averageFantasyScore: avg } },
    );
  }

  // ── Step 4: Update LineupSlot.pointsScored for affected athletes ──
  // Build a map: athleteId → totalPoints from this tournament
  const tournamentPointsMap = new Map<string, number>();

  for (const athleteId of allAthleteIds) {
    const agg = await AthleteMatchPoints.aggregate([
      {
        $match: {
          tournamentId: new mongoose.Types.ObjectId(String(match.tournamentId)),
          athleteId: new mongoose.Types.ObjectId(athleteId),
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPoints" } } },
    ]);
    tournamentPointsMap.set(athleteId, agg[0]?.total ?? 0);
  }

  // Find all locked lineups for this tournament
  const lockedLineups = await Lineup.find({
    tournamentId: match.tournamentId,
    isLocked: true,
  })
    .select("_id fantasyTeamId")
    .lean();

  const lineupIds = lockedLineups.map((l) => l._id);
  const fantasyTeamIds = [...new Set(lockedLineups.map((l) => String(l.fantasyTeamId)))];

  if (lineupIds.length === 0) return;

  // Update each starter slot for affected athletes
  for (const [athleteId, pts] of tournamentPointsMap.entries()) {
    await LineupSlot.updateMany(
      {
        lineupId: { $in: lineupIds },
        athleteId: new mongoose.Types.ObjectId(athleteId),
        $or: [{ role: LineupRole.STARTER }, { substitutedIn: true }],
      },
      { $set: { pointsScored: pts } },
    );
  }

  // ── Step 5: Recalculate FantasyTeam.totalPoints ──────────────
  for (const ftId of fantasyTeamIds) {
    // Sum all starter slot points across ALL locked lineups for this team (all tournaments = season total)
    const allLineupDocs = await Lineup.find({ fantasyTeamId: ftId, isLocked: true })
      .select("_id")
      .lean();
    const allLineupIds = allLineupDocs.map((l) => l._id);

    const agg = await LineupSlot.aggregate([
      {
        $match: {
          lineupId: { $in: allLineupIds },
          $or: [{ role: LineupRole.STARTER }, { substitutedIn: true }],
        },
      },
      { $group: { _id: null, total: { $sum: "$pointsScored" } } },
    ]);

    await FantasyTeam.updateOne(
      { _id: ftId },
      { $set: { totalPoints: agg[0]?.total ?? 0 } },
    );
  }

  // ── Step 6: Upsert GameweekStanding and re-rank ───────────────
  // Get all leagues for this championship
  const tournament = await Tournament.findById(match.tournamentId).lean();
  if (!tournament) return;

  const leagues = await League.find({
    championshipId: tournament.championshipId,
    status: { $ne: LeagueStatus.COMPLETED },
  })
    .select("_id")
    .lean();

  for (const league of leagues) {
    const leagueId = String(league._id);

    // Get all fantasy teams in this league that have a locked lineup for this tournament
    const memberships = await LeagueMembership.find({ leagueId }).lean();
    const memberUserIds = memberships.map((m) => String(m.userId));

    const teams = await FantasyTeam.find({
      leagueId,
      userId: { $in: memberUserIds },
    }).lean();

    for (const team of teams) {
      // Check enrollment date — no retroactive points (§11.1)
      const membership = memberships.find(
        (m) => String(m.userId) === String(team.userId),
      );
      if (!membership) continue;
      // §11.1: skip teams that enrolled after this tournament ended
      if (tournament.endDate < membership.enrolledAt) continue;

      // Find team's lineup for this tournament
      const lineup = lockedLineups.find(
        (l) => String(l.fantasyTeamId) === String(team._id),
      );
      if (!lineup) {
        // Team has no lineup for this tournament — skip (0 points)
        continue;
      }

      // Sum starter slot points for this specific (team, tournament)
      const slots = await LineupSlot.find({
        lineupId: lineup._id,
        $or: [{ role: LineupRole.STARTER }, { substitutedIn: true }],
      }).lean();

      const gameweekPts = slots.reduce((sum, s) => sum + (s.pointsScored ?? 0), 0);

      // Get cumulative points for prior tournaments
      const priorTotal = await GameweekStanding.aggregate([
        {
          $match: {
            leagueId: league._id,
            fantasyTeamId: team._id,
            tournamentId: { $ne: new mongoose.Types.ObjectId(String(match.tournamentId)) },
          },
        },
        { $group: { _id: null, total: { $sum: "$gameweekPoints" } } },
      ]);
      const cumulative = (priorTotal[0]?.total ?? 0) + gameweekPts;

      await GameweekStanding.findOneAndUpdate(
        {
          leagueId: league._id,
          fantasyTeamId: team._id,
          tournamentId: match.tournamentId,
        },
        {
          $set: {
            gameweekPoints: gameweekPts,
            cumulativePoints: cumulative,
          },
        },
        { upsert: true },
      );
    }

    // Re-rank all standings for this league + tournament
    const standings = await GameweekStanding.find({
      leagueId: league._id,
      tournamentId: match.tournamentId,
    })
      .sort({ gameweekPoints: -1, _id: 1 })
      .lean();

    const rankUpdates = standings.map((s, i) => ({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: { rank: i + 1 } },
      },
    }));

    if (rankUpdates.length > 0) {
      await GameweekStanding.bulkWrite(rankUpdates);
    }
  }

  logger.info({ matchId, tournamentId: String(match.tournamentId) }, "Cascade complete");
}
