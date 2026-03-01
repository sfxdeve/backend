import { Championship } from "../../models/RealWorld.js";
import { AppError } from "../../lib/errors.js";
import type { CreateChampionshipBodyType, UpdateChampionshipBodyType } from "./schema.js";

export async function list() {
  return Championship.find().sort({ seasonYear: -1, name: 1 }).lean();
}

export async function getById(id: string) {
  const doc = await Championship.findById(id).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Championship not found");
  return doc;
}

export async function create(body: CreateChampionshipBodyType) {
  return Championship.create(body);
}

export async function update(id: string, body: UpdateChampionshipBodyType) {
  const doc = await Championship.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  }).lean();
  if (!doc) throw new AppError("NOT_FOUND", "Championship not found");
  return doc;
}
