import { Player } from "../models/Player.js";
import { PlayerScore } from "../models/PlayerScore.js";
import { AppError } from "../lib/errors.js";
import {
  paginationOptions,
  paginationMeta,
  type PaginationQuery,
} from "../lib/pagination.js";

export interface ListPlayersFilter {
  gender?: string;
  search?: string;
}

export interface ListPlayersResult {
  data: Record<string, unknown>[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export async function listPlayers(
  filter: ListPlayersFilter,
  pagination: PaginationQuery,
): Promise<ListPlayersResult> {
  const queryFilter: Record<string, unknown> = {};
  if (filter.gender) queryFilter.gender = filter.gender;
  if (filter.search) {
    queryFilter.$or = [
      { firstName: { $regex: filter.search, $options: "i" } },
      { lastName: { $regex: filter.search, $options: "i" } },
    ];
  }

  const opts = paginationOptions(pagination);
  const [players, total] = await Promise.all([
    Player.find(queryFilter)
      .sort({ lastName: 1, firstName: 1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    Player.countDocuments(queryFilter),
  ]);

  return {
    data: players as unknown as Record<string, unknown>[],
    meta: paginationMeta(total, pagination),
  };
}

export async function createPlayer(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const player = await Player.create(input);
  return player.toObject
    ? player.toObject()
    : (player as unknown as Record<string, unknown>);
}

export async function updatePlayer(
  playerId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const player = await Player.findByIdAndUpdate(playerId, input, {
    new: true,
  });
  if (!player) throw new AppError("NOT_FOUND", "Player not found");
  return player.toObject
    ? player.toObject()
    : (player as unknown as Record<string, unknown>);
}

export interface PlayerStatsItem {
  _id: unknown;
  matchesPlayed: number;
  wins: number;
  losses: number;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  tournament?: unknown;
}

export interface GetPlayerStatsResult {
  player: Record<string, unknown>;
  stats: PlayerStatsItem[];
}

export async function getPlayerStats(
  playerId: string,
): Promise<GetPlayerStatsResult> {
  const player = await Player.findById(playerId).lean();
  if (!player) throw new AppError("NOT_FOUND", "Player not found");

  const scores = await PlayerScore.aggregate([
    { $match: { playerId: player._id } },
    {
      $group: {
        _id: "$tournamentId",
        matchesPlayed: { $sum: 1 },
        wins: { $sum: { $cond: ["$isWin", 1, 0] } },
        losses: { $sum: { $cond: ["$isWin", 0, 1] } },
        basePoints: { $sum: "$basePoints" },
        bonusPoints: { $sum: "$bonusPoints" },
        totalPoints: { $sum: "$totalPoints" },
      },
    },
    {
      $lookup: {
        from: "tournaments",
        localField: "_id",
        foreignField: "_id",
        as: "tournament",
      },
    },
    { $unwind: { path: "$tournament", preserveNullAndEmptyArrays: true } },
  ]);

  return {
    player: player as unknown as Record<string, unknown>,
    stats: scores as PlayerStatsItem[],
  };
}
