import { Season } from "../models/Season.js";
import { AppError } from "../lib/errors.js";

export async function listSeasons(): Promise<Record<string, unknown>[]> {
  const seasons = await Season.find().sort({ year: -1 }).lean();
  return seasons as unknown as Record<string, unknown>[];
}

export async function createSeason(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const season = await Season.create(input);
  return season.toObject
    ? season.toObject()
    : (season as unknown as Record<string, unknown>);
}

export async function updateSeason(
  seasonId: string,
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const season = await Season.findByIdAndUpdate(seasonId, input, {
    new: true,
  });
  if (!season) throw new AppError("NOT_FOUND", "Season not found");
  return season.toObject
    ? season.toObject()
    : (season as unknown as Record<string, unknown>);
}
