import { Season } from "../models/Season.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";
import { Gender } from "../models/enums.js";

export interface ListSeasonsQuery extends PaginationQuery {
  year?: number;
  gender?: string;
  isActive?: boolean;
}

export async function list(query: ListSeasonsQuery) {
  const filter: Record<string, unknown> = {};
  if (query.year != null) filter.year = query.year;
  if (query.gender != null) filter.gender = query.gender;
  if (query.isActive != null) filter.isActive = query.isActive;
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    Season.find(filter)
      .sort({ year: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    Season.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function getById(id: string) {
  const season = await Season.findById(id).lean();
  if (!season) throw new AppError("NOT_FOUND", "Season not found");
  return season;
}

export interface CreateSeasonBody {
  name: string;
  year: number;
  gender: Gender;
  isActive?: boolean;
}

export async function create(body: CreateSeasonBody) {
  const season = await Season.create({
    name: body.name,
    year: body.year,
    gender: body.gender,
    isActive: body.isActive ?? true,
  });
  return season.toObject();
}

export async function update(
  id: string,
  body: Partial<CreateSeasonBody>,
): Promise<void> {
  const doc = await Season.findById(id);
  if (!doc) throw new AppError("NOT_FOUND", "Season not found");
  if (body.name != null) doc.name = body.name;
  if (body.year != null) doc.year = body.year;
  if (body.gender != null) doc.gender = body.gender;
  if (body.isActive != null) doc.isActive = body.isActive;
  await doc.save();
}
