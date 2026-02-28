import crypto from "node:crypto";
import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog.js";
import { AuditLogType } from "../models/enums.js";
import { Match } from "../models/Match.js";
import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import { appEmitter } from "../events/emitter.js";
import type { ListMatchesQuery, CreateMatchBody, UpdateScoreBody } from "../validators/matches.js";
import { MatchStatus, TournamentStatus } from "../models/enums.js";

export function computeMatchId(
  tournamentId: string,
  phase: string,
  bracketSlot: string | number | undefined,
  scheduledAt: Date,
): string {
  const slot = bracketSlot ?? "";
  const input = `${tournamentId}${phase}${slot}${scheduledAt.toISOString()}`;
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function listForTournament(
  tournamentId: string,
  query: ListMatchesQuery,
) {
  const filter: Record<string, unknown> = { tournamentId };
  if (query.phase) filter.phase = query.phase;
  if (query.status) filter.status = query.status;
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    Match.find(filter)
      .sort({ scheduledAt: 1, bracketSlot: 1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .populate("homePairId")
      .populate("awayPairId")
      .lean(),
    Match.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function getById(id: string) {
  const match = await Match.findById(id)
    .populate("homePairId")
    .populate("awayPairId")
    .populate("poolGroupId")
    .lean();
  if (!match) throw new AppError("NOT_FOUND", "Match not found");
  return match;
}

export async function create(body: CreateMatchBody) {
  const matchId = computeMatchId(
    body.tournamentId,
    body.phase,
    body.bracketSlot,
    body.scheduledAt,
  );
  const existing = await Match.findOne({ matchId }).lean();
  if (existing)
    throw new AppError(
      "CONFLICT",
      "Match with same slot/phase/time already exists",
    );
  const match = await Match.create({
    tournamentId: body.tournamentId,
    phase: body.phase,
    status: MatchStatus.SCHEDULED,
    matchId,
    poolGroupId: body.poolGroupId,
    poolRound: body.poolRound,
    bracketSlot: body.bracketSlot != null ? String(body.bracketSlot) : undefined,
    scheduledAt: body.scheduledAt,
  });
  return match.toObject();
}

export async function updateScore(
  matchId: string,
  body: UpdateScoreBody,
  adminUserId: string,
): Promise<void> {
  const match = await Match.findById(matchId);
  if (!match) throw new AppError("NOT_FOUND", "Match not found");

  const previousSets = match.sets ?? [];
  const previousResult = match.result;
  const isCorrection = match.isCompleted;

  if (isCorrection) {
    match.correctionHistory = match.correctionHistory ?? [];
    match.correctionHistory.push({
      at: new Date(),
      previousSets,
      by: adminUserId,
    });
    match.status = MatchStatus.CORRECTED;
  }
  match.sets = body.sets;
  match.result = body.result;
  match.playedAt = match.playedAt ?? new Date();
  const winnerId =
    body.result === "WIN_2_0" || body.result === "WIN_2_1"
      ? match.homePairId
      : match.awayPairId;
  const loserId =
    body.result === "WIN_2_0" || body.result === "WIN_2_1"
      ? match.awayPairId
      : match.homePairId;
  match.winnerId = winnerId ?? undefined;
  match.loserId = loserId ?? undefined;
  match.scoringDone = false;
  await match.save();

  if (isCorrection) {
    await AuditLog.create({
      type: AuditLogType.MATCH_CORRECTED,
      entity: "Match",
      entityId: match._id,
      tournamentId: match.tournamentId,
      by: adminUserId,
      meta: {
        previousSets,
        newSets: body.sets,
        previousResult,
        newResult: body.result,
      },
    });
  }

  appEmitter.emit("match:updated", {
    matchId: match._id.toString(),
    tournamentId: match.tournamentId.toString(),
    versionNumber: match.versionNumber,
  });
}

export async function setLive(matchId: string): Promise<void> {
  const match = await Match.findById(matchId);
  if (!match) throw new AppError("NOT_FOUND", "Match not found");
  await Match.updateOne(
    { _id: matchId },
    { $set: { status: MatchStatus.LIVE } },
  );
  const liveCount = await Match.countDocuments({
    tournamentId: match.tournamentId,
    status: MatchStatus.LIVE,
  });
  if (liveCount === 1) {
    await Tournament.updateOne(
      { _id: match.tournamentId },
      { $set: { status: TournamentStatus.LIVE } },
    );
  }
}

export async function complete(
  matchId: string,
  body: UpdateScoreBody,
): Promise<void> {
  const match = await Match.findById(matchId);
  if (!match) throw new AppError("NOT_FOUND", "Match not found");
  const winnerId =
    body.result === "WIN_2_0" || body.result === "WIN_2_1"
      ? match.homePairId
      : match.awayPairId;
  const loserId =
    body.result === "WIN_2_0" || body.result === "WIN_2_1"
      ? match.awayPairId
      : match.homePairId;
  match.sets = body.sets;
  match.result = body.result;
  match.playedAt = match.playedAt ?? new Date();
  match.winnerId = winnerId ?? undefined;
  match.loserId = loserId ?? undefined;
  match.isCompleted = true;
  match.status = MatchStatus.COMPLETED;
  match.versionNumber = (match.versionNumber ?? 0) + 1;
  await match.save();
  appEmitter.emit("match:updated", {
    matchId: match._id.toString(),
    tournamentId: match.tournamentId.toString(),
    versionNumber: match.versionNumber,
  });
}
