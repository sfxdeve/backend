import { Match } from "../models/Match.js";
import { AppError } from "../lib/errors.js";
import { withMongoTransaction } from "../lib/tx.js";
import { applyMatchResult } from "./scoring.service.js";
import { advanceBracket } from "./bracket.service.js";
import type { MatchResult } from "../models/enums.js";

export interface ListMatchesFilter {
  tournamentId: string;
  phase?: string;
}

export async function listMatches(
  filter: ListMatchesFilter,
): Promise<Record<string, unknown>[]> {
  const queryFilter: Record<string, unknown> = {
    tournamentId: filter.tournamentId,
  };
  if (filter.phase) queryFilter.phase = filter.phase;

  const matches = await Match.find(queryFilter)
    .populate("homePairId")
    .populate("awayPairId")
    .sort({ scheduledAt: 1 })
    .lean();
  return matches as unknown as Record<string, unknown>[];
}

export async function createMatch(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const match = await Match.create(input);
  return match.toObject
    ? match.toObject()
    : (match as unknown as Record<string, unknown>);
}

export async function updateMatch(
  matchId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const match = await Match.findByIdAndUpdate(matchId, input, {
    new: true,
  });
  if (!match) throw new AppError("NOT_FOUND", "Match not found");
  return match.toObject
    ? match.toObject()
    : (match as unknown as Record<string, unknown>);
}

export interface SubmitResultInput {
  sets: Array<{ home: number; away: number }>;
  playedAt?: string;
}

export async function submitResult(
  matchId: string,
  input: SubmitResultInput,
): Promise<void> {
  const { sets, playedAt } = input;

  const match = await Match.findById(matchId);
  if (!match) throw new AppError("NOT_FOUND", "Match not found");
  if (match.isCompleted) {
    throw new AppError("CONFLICT", "Result already entered for this match");
  }
  if (!match.homePairId || !match.awayPairId) {
    throw new AppError(
      "BAD_REQUEST",
      "Match pairs must be assigned before submitting a result",
    );
  }

  const homeWins = sets.filter((s) => s.home > s.away).length;
  const awayWins = sets.filter((s) => s.away > s.home).length;

  if (homeWins < 2 && awayWins < 2) {
    throw new AppError(
      "BAD_REQUEST",
      "Sets must produce a valid 2-0 or 2-1 result",
    );
  }

  const result: MatchResult = `${homeWins}_${awayWins}` as MatchResult;
  const winnerId = homeWins > awayWins ? match.homePairId : match.awayPairId;
  const loserId = homeWins > awayWins ? match.awayPairId : match.homePairId;
  const resolvedPlayedAt = playedAt ? new Date(playedAt) : new Date();

  await withMongoTransaction(async (session) => {
    await Match.updateOne(
      { _id: match._id },
      {
        sets,
        result,
        winnerId,
        loserId,
        isCompleted: true,
        playedAt: resolvedPlayedAt,
      },
      { session },
    );
    await applyMatchResult(String(match._id), session);
    await advanceBracket(String(match._id), session);
  });
}
