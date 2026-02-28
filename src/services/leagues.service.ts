import crypto from "node:crypto";
import { League } from "../models/League.js";
import { LeagueMember } from "../models/LeagueMember.js";
import { Lineup } from "../models/Lineup.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";
import {
  CreditTransactionSource,
  LeagueGameMode,
  LeagueStatus,
} from "../models/enums.js";
import * as walletService from "./wallet.service.js";

export interface ListLeaguesQuery extends PaginationQuery {
  tournamentId?: string;
  isPublic?: boolean;
  status?: string;
}

export async function listPublic(query: ListLeaguesQuery) {
  const filter: Record<string, unknown> = { isPublic: true };
  if (query.tournamentId) filter.tournamentId = query.tournamentId;
  if (query.status) filter.status = query.status;
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    League.find(filter)
      .skip(opts.skip)
      .limit(opts.limit)
      .populate("ownerId", "name")
      .lean(),
    League.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function getById(id: string) {
  const league = await League.findById(id)
    .populate("ownerId", "name email")
    .populate("tournamentId", "name startDate endDate")
    .lean();
  if (!league) throw new AppError("NOT_FOUND", "League not found");
  return league;
}

export interface CreateLeagueBody {
  tournamentId: string;
  name: string;
  isPublic: boolean;
  gameMode?: LeagueGameMode;
  entryFee?: number;
  maxMembers?: number;
}

export async function create(userId: string, body: CreateLeagueBody) {
  const inviteCode = body.isPublic
    ? undefined
    : crypto.randomBytes(4).toString("base64url").slice(0, 8);
  const league = await League.create({
    tournamentId: body.tournamentId,
    ownerId: userId,
    name: body.name,
    isPublic: body.isPublic,
    inviteCode,
    status: LeagueStatus.REGISTRATION_OPEN,
    gameMode: body.gameMode ?? LeagueGameMode.CLASSIC,
    entryFee: body.entryFee ?? 0,
    maxMembers: body.maxMembers,
  });
  await LeagueMember.create({
    leagueId: league._id,
    userId,
    totalPoints: 0,
  });
  return league.toObject();
}

export async function join(
  userId: string,
  leagueId: string,
  inviteCode?: string,
): Promise<void> {
  const league = await League.findById(leagueId);
  if (!league) throw new AppError("NOT_FOUND", "League not found");
  if (league.status !== LeagueStatus.REGISTRATION_OPEN)
    throw new AppError("BAD_REQUEST", "League registration is closed");
  const existing = await LeagueMember.findOne({ leagueId, userId }).lean();
  if (existing) throw new AppError("CONFLICT", "Already a member");
  if (league.maxMembers) {
    const count = await LeagueMember.countDocuments({ leagueId });
    if (count >= league.maxMembers)
      throw new AppError("BAD_REQUEST", "League is full");
  }
  if (!league.isPublic && league.inviteCode !== inviteCode)
    throw new AppError("FORBIDDEN", "Invalid invite code");
  if (league.entryFee && league.entryFee > 0) {
    await walletService.debit(
      userId,
      league.entryFee,
      "SPEND",
      CreditTransactionSource.SYSTEM,
      { leagueId, reason: "entry_fee" },
    );
  }
  await LeagueMember.create({
    leagueId,
    userId,
    totalPoints: 0,
  });
}

export async function getStandings(leagueId: string) {
  return LeagueMember.find({ leagueId })
    .sort({ totalPoints: -1 })
    .populate("userId", "name email")
    .lean();
}

export interface UpdateLeagueBody {
  name?: string;
  isPublic?: boolean;
  maxMembers?: number;
}

export async function update(
  leagueId: string,
  userId: string,
  isAdmin: boolean,
  body: UpdateLeagueBody,
): Promise<void> {
  const league = await League.findById(leagueId);
  if (!league) throw new AppError("NOT_FOUND", "League not found");
  if (league.status !== LeagueStatus.REGISTRATION_OPEN)
    throw new AppError("BAD_REQUEST", "Can only update before IN_PROGRESS");
  const isOwner = league.ownerId.toString() === userId;
  if (!isOwner && !isAdmin)
    throw new AppError("FORBIDDEN", "Only owner or admin can update");
  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.isPublic != null) updates.isPublic = body.isPublic;
  if (body.maxMembers != null) updates.maxMembers = body.maxMembers;
  await League.updateOne({ _id: leagueId }, { $set: updates });
}
