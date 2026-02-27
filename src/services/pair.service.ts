import { Pair } from "../models/Pair.js";
import { Player } from "../models/Player.js";
import { Match } from "../models/Match.js";
import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";

export async function listPairs(
  tournamentId: string,
): Promise<Record<string, unknown>[]> {
  const pairs = await Pair.find({ tournamentId })
    .populate("player1Id", "firstName lastName gender")
    .populate("player2Id", "firstName lastName gender")
    .lean();
  return pairs as unknown as Record<string, unknown>[];
}

export interface CreatePairInput {
  tournamentId: string;
  player1Id: string;
  player2Id: string;
}

export async function createPair(
  input: CreatePairInput,
): Promise<Record<string, unknown>> {
  const { tournamentId, player1Id, player2Id } = input;

  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");

  const [p1, p2] = await Promise.all([
    Player.findById(player1Id).lean(),
    Player.findById(player2Id).lean(),
  ]);

  if (!p1) throw new AppError("NOT_FOUND", "Player 1 not found");
  if (!p2) throw new AppError("NOT_FOUND", "Player 2 not found");
  if (p1.gender !== tournament.gender || p2.gender !== tournament.gender) {
    throw new AppError("BAD_REQUEST", "Players must match tournament gender");
  }
  if (player1Id === player2Id) {
    throw new AppError(
      "BAD_REQUEST",
      "A pair must consist of two different players",
    );
  }

  const pair = await Pair.create({ tournamentId, player1Id, player2Id });
  return pair.toObject
    ? pair.toObject()
    : (pair as unknown as Record<string, unknown>);
}

export async function deletePair(pairId: string): Promise<void> {
  const inUse = await Match.findOne({
    $or: [{ homePairId: pairId }, { awayPairId: pairId }],
  }).lean();
  if (inUse) {
    throw new AppError(
      "CONFLICT",
      "Cannot delete pair that has associated matches",
    );
  }

  const pair = await Pair.findByIdAndDelete(pairId);
  if (!pair) throw new AppError("NOT_FOUND", "Pair not found");
}
