import { Player } from "../models/Player.js";
import { Pair } from "../models/Pair.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";
import { Gender } from "../models/enums.js";

export interface ListPlayersQuery extends PaginationQuery {
  gender?: string;
  search?: string;
  tournamentId?: string;
}

export async function list(query: ListPlayersQuery) {
  const filter: Record<string, unknown> = {};
  if (query.gender) filter.gender = query.gender;
  if (query.search) {
    filter.$or = [
      { firstName: new RegExp(query.search, "i") },
      { lastName: new RegExp(query.search, "i") },
    ];
  }
  if (query.tournamentId) {
    const pairPlayerIds = await Pair.distinct("player1Id", {
      tournamentId: query.tournamentId,
    });
    const pairPlayerIds2 = await Pair.distinct("player2Id", {
      tournamentId: query.tournamentId,
    });
    const allIds = [...new Set([...pairPlayerIds, ...pairPlayerIds2])];
    filter._id = { $in: allIds };
  }
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    Player.find(filter).skip(opts.skip).limit(opts.limit).lean(),
    Player.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function getById(id: string) {
  const player = await Player.findById(id).lean();
  if (!player) throw new AppError("NOT_FOUND", "Player not found");
  return player;
}

export interface CreatePlayerBody {
  firstName: string;
  lastName: string;
  gender: Gender;
  nationality?: string;
  federationId?: string;
}

export async function create(body: CreatePlayerBody) {
  const player = await Player.create({
    firstName: body.firstName,
    lastName: body.lastName,
    gender: body.gender,
    nationality: body.nationality,
    federationId: body.federationId,
  });
  return player.toObject();
}

export async function update(
  id: string,
  body: Partial<CreatePlayerBody>,
): Promise<void> {
  await Player.updateOne({ _id: id }, { $set: body });
}

export async function adjustPrice(
  id: string,
  body: { currentPrice: number },
): Promise<void> {
  await Player.updateOne(
    { _id: id },
    { $set: { currentPrice: body.currentPrice } },
  );
}
