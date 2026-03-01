import { Match } from "../../models/RealWorld.js";
import { AthleteMatchPoints } from "../../models/Scoring.js";
import { AdminAuditLog } from "../../models/Admin.js";
import { MatchStatus } from "../../models/enums.js";
import { AppError } from "../../lib/errors.js";
import { runCascade } from "../../scoring/cascade.js";
import { logger } from "../../lib/logger.js";
import type {
  CreateMatchBodyType,
  UpdateMatchBodyType,
  MatchQueryParamsType,
} from "./schema.js";

export async function list(query: MatchQueryParamsType) {
  const filter: Record<string, unknown> = {};
  if (query.tournamentId) filter.tournamentId = query.tournamentId;
  if (query.round) filter.round = query.round;
  if (query.status) filter.status = query.status;

  return Match.find(filter)
    .populate({
      path: "pairAId",
      populate: [
        { path: "athleteAId", select: "firstName lastName" },
        { path: "athleteBId", select: "firstName lastName" },
      ],
    })
    .populate({
      path: "pairBId",
      populate: [
        { path: "athleteAId", select: "firstName lastName" },
        { path: "athleteBId", select: "firstName lastName" },
      ],
    })
    .sort({ scheduledAt: 1 })
    .lean();
}

export async function getById(id: string) {
  const match = await Match.findById(id)
    .populate({
      path: "pairAId",
      populate: [
        { path: "athleteAId", select: "firstName lastName pictureUrl" },
        { path: "athleteBId", select: "firstName lastName pictureUrl" },
      ],
    })
    .populate({
      path: "pairBId",
      populate: [
        { path: "athleteAId", select: "firstName lastName pictureUrl" },
        { path: "athleteBId", select: "firstName lastName pictureUrl" },
      ],
    })
    .lean();

  if (!match) throw new AppError("NOT_FOUND", "Match not found");

  // Attach athlete match points if available
  const points = await AthleteMatchPoints.find({ matchId: id })
    .populate("athleteId", "firstName lastName")
    .lean();

  return { ...match, athletePoints: points };
}

export async function create(body: CreateMatchBodyType) {
  return Match.create(body);
}

export async function update(
  id: string,
  body: UpdateMatchBodyType,
  adminId: string,
) {
  const before = await Match.findById(id).lean();
  if (!before) throw new AppError("NOT_FOUND", "Match not found");

  const { reason, ...updateFields } = body;

  const doc = await Match.findByIdAndUpdate(id, updateFields, {
    new: true,
    runValidators: true,
  }).lean();

  if (!doc) throw new AppError("NOT_FOUND", "Match not found");

  await AdminAuditLog.create({
    adminId,
    action: "UPDATE_MATCH",
    entity: "Match",
    entityId: id,
    before: before as unknown as Record<string, unknown>,
    after: doc as unknown as Record<string, unknown>,
    reason,
  });

  // Trigger cascade when match is completed or corrected
  if (
    doc.status === MatchStatus.COMPLETED ||
    doc.status === MatchStatus.CORRECTED
  ) {
    // Run cascade asynchronously to avoid blocking the response,
    // but still within the same process (no queue).
    runCascade(id).catch((err) => {
      logger.error({ err, matchId: id }, "Cascade error");
    });
  }

  return doc;
}
