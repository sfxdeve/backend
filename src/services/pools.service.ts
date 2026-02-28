import mongoose from "mongoose";
import { Match } from "../models/Match.js";
import { PoolGroup } from "../models/PoolGroup.js";
import { AppError } from "../lib/errors.js";
import type { CreateGroupBody } from "../validators/pools.js";

export async function listGroups(tournamentId: string) {
  const groups = await PoolGroup.find({ tournamentId }).lean();
  const withMatches = await Promise.all(
    groups.map(async (g) => {
      const matches = await Match.find({
        tournamentId,
        poolGroupId: g._id,
      }).lean();
      return { ...g, matches };
    }),
  );
  return withMatches;
}

export async function createGroup(tournamentId: string, body: CreateGroupBody) {
  const group = await PoolGroup.create({
    tournamentId,
    name: body.name,
    gender: body.gender,
  });
  return group.toObject();
}

export async function assignPair(
  poolGroupId: string,
  pairId: string,
): Promise<void> {
  const group = await PoolGroup.findById(poolGroupId);
  if (!group) throw new AppError("NOT_FOUND", "Pool group not found");
  // Store pair assignment: Match has poolGroupId; creating a match or updating match's poolGroupId.
  // Spec says "assignPair(poolGroupId, pairId)" - we need a way to link pair to pool.
  // PoolGroup doesn't have pairIds in schema. So "assign" might mean creating a match in that pool for the pair, or adding pair to a list. Re-read: "assignPair(poolGroupId, pairId) → admin". Likely we add pair to pool group - so we need to add pairIds to PoolGroup schema or have a separate PoolGroupPair model. Schema only has tournamentId, name, gender. So I'll add an optional pairIds array to PoolGroup for assignment, or we could add a Match with poolGroupId and homePairId set. The spec says "assign pair" - simplest is add pairIds to PoolGroup. Let me add pairIds to the PoolGroup model.
  await PoolGroup.updateOne(
    { _id: poolGroupId },
    { $addToSet: { pairIds: new mongoose.Types.ObjectId(pairId) } },
  );
}
