import crypto from "node:crypto";
import type { Types } from "mongoose";
import { League } from "../models/League.js";
import { LeagueMember } from "../models/LeagueMember.js";
import { Tournament } from "../models/Tournament.js";
import { AppError } from "../lib/errors.js";
import { computeUserTournamentScore } from "./scoring.service.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";

const INVITE_CODE_LENGTH = 8;

function generateInviteCode(): string {
  return crypto
    .randomBytes(INVITE_CODE_LENGTH)
    .toString("base64url")
    .slice(0, INVITE_CODE_LENGTH);
}

export async function ensureUniqueInviteCode(): Promise<string> {
  let code = generateInviteCode();
  for (let i = 0; i < 10; i++) {
    const existing = await League.findOne({ inviteCode: code }).lean();
    if (!existing) return code;
    code = generateInviteCode();
  }
  throw new AppError(
    "INTERNAL_SERVER_ERROR",
    "Could not generate unique invite code",
  );
}

export async function listLeagues(params: {
  userId?: string;
  isAdmin?: boolean;
  isPublic?: boolean;
  tournamentId?: string;
  page: number;
  limit: number;
}) {
  const { userId, isAdmin, isPublic, tournamentId, page, limit } = params;
  const filter: Record<string, unknown> = {};
  if (tournamentId) filter.tournamentId = tournamentId;
  if (typeof isPublic === "boolean") filter.isPublic = isPublic;

  if (!isAdmin && userId) {
    const myLeagueIds = await LeagueMember.find({ userId })
      .distinct("leagueId")
      .lean();
    filter.$or = [{ isPublic: true }, { _id: { $in: myLeagueIds } }];
  } else if (!isAdmin) {
    filter.isPublic = true;
  }

  const q = { page, limit };
  const opts = paginationOptions(q);
  const [leagues, total] = await Promise.all([
    League.find(filter)
      .populate("tournamentId", "name startDate status")
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    League.countDocuments(filter),
  ]);

  const memberCounts = await Promise.all(
    leagues.map((l) => LeagueMember.countDocuments({ leagueId: l._id })),
  );

  const data = leagues.map((league, i) => ({
    ...league,
    memberCount: memberCounts[i],
    tournament: league.tournamentId,
  }));

  return { data, meta: paginationMeta(total, q) };
}

export async function createLeague(params: {
  userId: string;
  tournamentId: string;
  name: string;
  startDate: Date;
  isPublic: boolean;
  inviteCode?: string;
  playerAvailability?: string;
  gameMode?: string;
  typology?: string;
  banner?: string;
}) {
  const tournament = await Tournament.findById(params.tournamentId).lean();
  if (!tournament) throw new AppError("NOT_FOUND", "Tournament not found");
  if (tournament.status !== "REGISTRATION_OPEN") {
    throw new AppError(
      "BAD_REQUEST",
      "Tournament must be in REGISTRATION_OPEN status",
    );
  }
  const startDate = new Date(params.startDate);
  if (startDate < new Date(tournament.startDate)) {
    throw new AppError(
      "BAD_REQUEST",
      "League start date must be >= tournament start date",
    );
  }

  let inviteCode: string | undefined = params.inviteCode;
  if (!params.isPublic && !inviteCode) {
    inviteCode = await ensureUniqueInviteCode();
  }

  const league = await League.create({
    tournamentId: params.tournamentId,
    ownerId: params.userId,
    name: params.name,
    isPublic: params.isPublic,
    inviteCode: params.isPublic ? undefined : inviteCode,
    status: "REGISTRATION_OPEN",
    startDate,
    playerAvailability: params.playerAvailability,
    gameMode: params.gameMode,
    typology: params.typology,
    banner: params.banner,
  });

  await LeagueMember.create({
    leagueId: league._id,
    userId: params.userId,
  });

  return league;
}

export async function joinLeague(
  leagueId: string,
  userId: string,
): Promise<void> {
  const league = await League.findById(leagueId).lean();
  if (!league) throw new AppError("NOT_FOUND", "League not found");
  if (!league.isPublic) {
    throw new AppError("NOT_FOUND", "Private league: use invite code to join");
  }
  if (league.status !== "REGISTRATION_OPEN") {
    throw new AppError("BAD_REQUEST", "League registration is closed");
  }
  const existing = await LeagueMember.findOne({ leagueId, userId }).lean();
  if (existing) throw new AppError("CONFLICT", "Already a member");

  await LeagueMember.create({ leagueId, userId });
}

export async function joinLeagueByCode(
  inviteCode: string,
  userId: string,
): Promise<void> {
  const league = await League.findOne({ inviteCode }).lean();
  if (!league) throw new AppError("NOT_FOUND", "League not found");
  if (league.status !== "REGISTRATION_OPEN") {
    throw new AppError("BAD_REQUEST", "League registration is closed");
  }
  const existing = await LeagueMember.findOne({
    leagueId: league._id,
    userId,
  }).lean();
  if (existing) throw new AppError("CONFLICT", "Already a member");

  await LeagueMember.create({ leagueId: league._id, userId });
}

export async function getLeagueById(
  leagueId: string,
  userId?: string,
  isAdmin?: boolean,
) {
  const league = await League.findById(leagueId)
    .populate("tournamentId", "name startDate status")
    .lean();
  if (!league) throw new AppError("NOT_FOUND", "League not found");

  if (!league.isPublic && !isAdmin) {
    if (!userId) throw new AppError("NOT_FOUND", "League not found");
    const member = await LeagueMember.findOne({ leagueId, userId }).lean();
    if (!member) throw new AppError("NOT_FOUND", "League not found");
  }

  const memberCount = await LeagueMember.countDocuments({ leagueId });

  const previewSize = 5;
  const members = await LeagueMember.find({ leagueId })
    .limit(previewSize)
    .lean();
  const preview = await Promise.all(
    members.map(async (m) => {
      const score = await computeUserTournamentScore(
        String(m.userId),
        String(league.tournamentId),
      );
      return { userId: m.userId, total: score.total };
    }),
  );
  preview.sort((a, b) => b.total - a.total);
  const leaderboardPreview = preview.map((p, i) => ({
    rank: i + 1,
    userId: p.userId,
    total: p.total,
  }));

  return {
    ...league,
    tournament: league.tournamentId,
    memberCount,
    leaderboardPreview,
  };
}

export async function getLeagueLeaderboard(
  leagueId: string,
  userId?: string,
  isAdmin?: boolean,
) {
  const league = await League.findById(leagueId).lean();
  if (!league) throw new AppError("NOT_FOUND", "League not found");

  if (!league.isPublic && !isAdmin) {
    if (!userId) throw new AppError("NOT_FOUND", "League not found");
    const member = await LeagueMember.findOne({ leagueId, userId }).lean();
    if (!member) throw new AppError("NOT_FOUND", "League not found");
  }

  const members = await LeagueMember.find({ leagueId })
    .populate("userId", "name email")
    .lean();

  const scores = await Promise.all(
    members.map(async (m) => {
      const uid =
        m.userId && typeof m.userId === "object" && "_id" in m.userId
          ? (m.userId as { _id: Types.ObjectId })._id
          : m.userId;
      const score = await computeUserTournamentScore(
        String(uid),
        String(league.tournamentId),
      );
      return { user: m.userId, total: score.total };
    }),
  );

  scores.sort((a, b) => b.total - a.total);
  return scores.map((s, i) => ({ rank: i + 1, ...s }));
}
