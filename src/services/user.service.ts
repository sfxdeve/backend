import { User } from "../models/User.js";
import { TournamentRegistration } from "../models/TournamentRegistration.js";
import { LeagueMember } from "../models/LeagueMember.js";
import { AppError } from "../lib/errors.js";
import {
  paginationOptions,
  paginationMeta,
  type PaginationQuery,
} from "../lib/pagination.js";
import { revokeAllUserSessions } from "../lib/session.js";
import { getOrCreateWallet } from "./wallet.service.js";
import { computeUserTournamentScore } from "./scoring.service.js";

export interface GetMeResult {
  user: Record<string, unknown>;
  wallet: { balance: number; totalPurchased: number; totalSpent: number };
  registeredTournamentsCount: number;
  leagues: Array<{
    leagueId: unknown;
    name: string;
    tournamentId: unknown;
  }>;
  tournaments: Array<{
    tournamentId: string;
    name?: string;
    status?: string;
    myScore: number;
  }>;
}

export async function getMe(userId: string): Promise<GetMeResult> {
  const user = await User.findById(userId).select("-passwordHash").lean();
  if (!user) throw new AppError("NOT_FOUND", "User not found");

  const [wallet, registrations, leagueMembers] = await Promise.all([
    getOrCreateWallet(userId),
    TournamentRegistration.find({ userId })
      .populate("tournamentId", "name status")
      .lean(),
    LeagueMember.find({ userId })
      .populate("leagueId", "name tournamentId")
      .lean(),
  ]);

  const tournamentIds = registrations.map((reg) => {
    const t = reg.tournamentId;
    return typeof t === "object" && t !== null && "_id" in t
      ? (t as { _id: unknown })._id
      : t;
  });

  const tournaments = await Promise.all(
    registrations.map(async (reg, i) => {
      const tournament = reg.tournamentId as unknown as {
        _id: unknown;
        name: string;
        status: string;
      } | null;
      const tid = String(tournamentIds[i]);
      const score = await computeUserTournamentScore(userId, tid);
      return {
        tournamentId: tid,
        name: tournament?.name,
        status: tournament?.status,
        myScore: score.total,
      };
    }),
  );

  const leagues = leagueMembers
    .filter((m) => m.leagueId && typeof m.leagueId === "object")
    .map((m) => {
      const league = m.leagueId as unknown as {
        _id: unknown;
        name: string;
        tournamentId: unknown;
      };
      return {
        leagueId: league._id,
        name: league.name,
        tournamentId: league.tournamentId,
      };
    });

  return {
    user: user as unknown as Record<string, unknown>,
    wallet: {
      balance: wallet.balance,
      totalPurchased: wallet.totalPurchased,
      totalSpent: wallet.totalSpent,
    },
    registeredTournamentsCount: registrations.length,
    leagues,
    tournaments,
  };
}

export async function updateMe(
  userId: string,
  input: { name: string },
): Promise<Record<string, unknown>> {
  const user = await User.findByIdAndUpdate(
    userId,
    { name: input.name },
    { new: true },
  ).select("-passwordHash");
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  return user.toObject
    ? user.toObject()
    : (user as unknown as Record<string, unknown>);
}

export interface ListUsersResult {
  data: Record<string, unknown>[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export async function listUsers(
  pagination: PaginationQuery,
): Promise<ListUsersResult> {
  const opts = paginationOptions(pagination);
  const [users, total] = await Promise.all([
    User.find()
      .select("-passwordHash")
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    User.countDocuments(),
  ]);
  return {
    data: users as unknown as Record<string, unknown>[],
    meta: paginationMeta(total, pagination),
  };
}

export async function blockUser(
  actorUserId: string,
  targetUserId: string,
  input: { isBlocked: boolean },
): Promise<Record<string, unknown>> {
  if (targetUserId === actorUserId) {
    throw new AppError("BAD_REQUEST", "Cannot block yourself");
  }

  const user = await User.findByIdAndUpdate(
    targetUserId,
    { isBlocked: input.isBlocked },
    { new: true },
  ).select("-passwordHash");
  if (!user) throw new AppError("NOT_FOUND", "User not found");

  if (input.isBlocked) {
    await revokeAllUserSessions(targetUserId);
  }

  return user.toObject
    ? user.toObject()
    : (user as unknown as Record<string, unknown>);
}
