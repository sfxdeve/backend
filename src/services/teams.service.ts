import { Lineup } from "../models/Lineup.js";
import { Player } from "../models/Player.js";
import { Team } from "../models/Team.js";
import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";
import { CreditTransactionSource } from "../models/enums.js";
import * as walletService from "./wallet.service.js";
import type { SetTeamBody } from "../validators/teams.js";

export async function getTeam(userId: string, tournamentId: string) {
  const team = await Team.findOne({ userId, tournamentId })
    .populate("playerIds")
    .lean();
  return team ?? null;
}

export async function createOrUpdate(
  userId: string,
  tournamentId: string,
  body: SetTeamBody,
): Promise<void> {
  const tournament = await Tournament.findById(tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  const rosterSize = tournament.rosterSize ?? 7;
  if (body.playerIds.length !== rosterSize)
    throw new AppError(
      "BAD_REQUEST",
      `Must have exactly ${rosterSize} players`,
    );
  const players = await Player.find({ _id: { $in: body.playerIds } }).lean();
  if (players.length !== body.playerIds.length)
    throw new AppError("BAD_REQUEST", "Invalid or duplicate player IDs");
  const budgetSpent = players.reduce(
    (sum, p) => sum + (p.currentPrice ?? 100),
    0,
  );
  const existing = await Team.findOne({ userId, tournamentId }).lean();
  if (existing) {
    await Team.updateOne(
      { userId, tournamentId },
      { $set: { playerIds: body.playerIds, budgetSpent } },
    );
    return;
  }
  await walletService.debit(
    userId,
    budgetSpent,
    "SPEND",
    CreditTransactionSource.SYSTEM,
    { tournamentId, reason: "team_creation" },
  );
  await Team.create({
    userId,
    tournamentId,
    playerIds: body.playerIds,
    budgetSpent,
  });
  await Lineup.create({
    userId,
    tournamentId,
    starters: [],
    reserves: [],
    status: "DRAFT",
  });
}
