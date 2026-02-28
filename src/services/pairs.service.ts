import { Match } from "../models/Match.js";
import { Pair } from "../models/Pair.js";
import { AppError } from "../lib/errors.js";

export interface CreatePairBody {
  player1Id: string;
  player2Id: string;
}

export async function create(tournamentId: string, body: CreatePairBody) {
  const pair = await Pair.create({
    tournamentId,
    player1Id: body.player1Id,
    player2Id: body.player2Id,
  });
  return pair.populate(["player1Id", "player2Id"]).then((p) => p.toObject());
}

export async function deletePair(pairId: string): Promise<void> {
  const played = await Match.exists({
    $or: [{ homePairId: pairId }, { awayPairId: pairId }],
    isCompleted: true,
  });
  if (played)
    throw new AppError("BAD_REQUEST", "Cannot delete pair with played matches");
  await Pair.deleteOne({ _id: pairId });
}

export async function listForTournament(tournamentId: string) {
  return Pair.find({ tournamentId })
    .populate("player1Id")
    .populate("player2Id")
    .lean();
}
