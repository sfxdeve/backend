import { PoolGroup } from "../models/PoolGroup.js";
import { AppError } from "../lib/errors.js";

export async function listPools(
  tournamentId: string,
): Promise<Record<string, unknown>[]> {
  const pools = await PoolGroup.find({ tournamentId })
    .populate("slots.pairId")
    .sort({ poolIndex: 1 })
    .lean();
  return pools as unknown as Record<string, unknown>[];
}

export async function createPoolGroup(
  input: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const pool = await PoolGroup.create(input);
  return pool.toObject
    ? pool.toObject()
    : (pool as unknown as Record<string, unknown>);
}

export async function updatePoolGroup(
  poolGroupId: string,
  input: { slots: unknown },
): Promise<Record<string, unknown>> {
  const pool = await PoolGroup.findByIdAndUpdate(
    poolGroupId,
    { slots: input.slots },
    { new: true },
  );
  if (!pool) throw new AppError("NOT_FOUND", "Pool group not found");
  return pool.toObject
    ? pool.toObject()
    : (pool as unknown as Record<string, unknown>);
}
