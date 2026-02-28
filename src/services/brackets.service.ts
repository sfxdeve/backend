import mongoose, { type ClientSession } from "mongoose";
import { Match } from "../models/Match.js";
import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";
import { MatchPhase, MatchStatus } from "../models/enums.js";
import {
  BRACKET_PROGRESSION,
  MAIN_DRAW_SLOTS,
  POOL_LOSER_SEEDING,
  POOL_WINNER_SEEDING,
} from "../scoring/bracket-config.js";
import { computeMatchId } from "./matches.service.js";

export async function getForTournament(tournamentId: string) {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  const matches = await Match.find({ tournamentId })
    .sort({ phase: 1, bracketSlot: 1, scheduledAt: 1 })
    .populate("homePairId")
    .populate("awayPairId")
    .populate("winnerId")
    .lean();
  const byPhase = matches.reduce(
    (acc, m) => {
      const p = m.phase as string;
      if (!acc[p]) acc[p] = [];
      acc[p].push(m);
      return acc;
    },
    {} as Record<string, typeof matches>,
  );
  return {
    tournamentId,
    phases: Object.values(MatchPhase),
    byPhase,
    matches,
  };
}

/**
 * Generate placeholder main draw matches (R12 through FINAL + 3RD).
 * All created with status=SCHEDULED and no pairIds (teams resolved later via resolveSlot).
 * Idempotent: skips slots that already exist.
 */
export async function generateBracket(tournamentId: string): Promise<void> {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  for (const { slot, phase } of MAIN_DRAW_SLOTS) {
    const scheduledAt = new Date(tournament.startDate);
    const mid = computeMatchId(tournamentId, phase, slot, scheduledAt);
    const exists = await Match.findOne({ matchId: mid }).lean();
    if (!exists) {
      await Match.create({
        tournamentId,
        phase,
        status: MatchStatus.SCHEDULED,
        matchId: mid,
        bracketSlot: slot,
        scheduledAt,
      });
    }
  }
}

/**
 * Advance the winner and/or loser of a completed match into the next bracket slot(s).
 * Handles both main draw progression and pool→main seeding.
 * Must be called inside the same Mongoose transaction as the scoring update.
 */
export async function resolveSlot(
  match: {
    _id: unknown;
    tournamentId: mongoose.Types.ObjectId | string;
    bracketSlot?: string | number | null;
    winnerId?: unknown;
    loserId?: unknown;
  },
  session: ClientSession,
): Promise<void> {
  const slot = match.bracketSlot?.toString();
  if (!slot || !match.winnerId) return;

  const opts = { session };
  const tournamentId = match.tournamentId;

  // Check main draw progression
  const progression = BRACKET_PROGRESSION[slot];
  if (progression) {
    if (progression.winner && match.winnerId) {
      const { slot: nextSlot, seat } = progression.winner;
      const field = seat === "home" ? "homePairId" : "awayPairId";
      await Match.updateOne(
        {
          tournamentId: tournamentId as mongoose.Types.ObjectId,
          bracketSlot: nextSlot,
        },
        { $set: { [field]: match.winnerId as mongoose.Types.ObjectId } },
        opts,
      );
    }
    if (progression.loser && match.loserId) {
      const { slot: nextSlot, seat } = progression.loser;
      const field = seat === "home" ? "homePairId" : "awayPairId";
      await Match.updateOne(
        {
          tournamentId: tournamentId as mongoose.Types.ObjectId,
          bracketSlot: nextSlot,
        },
        { $set: { [field]: match.loserId as mongoose.Types.ObjectId } },
        opts,
      );
    }
    return;
  }

  // Check pool winner → main draw seeding
  const winnerSeed = POOL_WINNER_SEEDING[slot];
  if (winnerSeed && match.winnerId) {
    const { slot: nextSlot, seat } = winnerSeed;
    const field = seat === "home" ? "homePairId" : "awayPairId";
    await Match.updateOne(
      {
        tournamentId: tournamentId as mongoose.Types.ObjectId,
        bracketSlot: nextSlot,
      },
      { $set: { [field]: match.winnerId as mongoose.Types.ObjectId } },
      opts,
    );
  }

  // Check pool loser → main draw seeding
  const loserSeed = POOL_LOSER_SEEDING[slot];
  if (loserSeed && match.loserId) {
    const { slot: nextSlot, seat } = loserSeed;
    const field = seat === "home" ? "homePairId" : "awayPairId";
    await Match.updateOne(
      {
        tournamentId: tournamentId as mongoose.Types.ObjectId,
        bracketSlot: nextSlot,
      },
      { $set: { [field]: match.loserId as mongoose.Types.ObjectId } },
      opts,
    );
  }
}
