import { User } from "../models/User.js";
import { CreditTransaction } from "../models/CreditTransaction.js";
import { Match } from "../models/Match.js";
import { AppError } from "../lib/errors.js";
import { hashSecret, compareSecret } from "../lib/hash.js";
import { revokeAllUserSessions } from "../lib/session.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";

export async function getProfile(userId: string) {
  const user = await User.findById(userId).select("-passwordHash").lean();
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  return user;
}

export async function updateProfile(
  userId: string,
  body: { name?: string },
): Promise<void> {
  const update: Record<string, string> = {};
  if (body.name != null) update.name = body.name;
  if (Object.keys(update).length === 0) return;
  await User.updateOne({ _id: userId }, { $set: update });
}

export async function changePassword(
  userId: string,
  body: { oldPassword: string; newPassword: string },
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  const ok = await compareSecret(body.oldPassword, user.passwordHash);
  if (!ok) throw new AppError("BAD_REQUEST", "Invalid current password");
  const passwordHash = await hashSecret(body.newPassword);
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
  await revokeAllUserSessions(userId.toString());
}

export async function listUsers(query: PaginationQuery & { search?: string }) {
  const filter: Record<string, unknown> = {};
  if (query.search) {
    filter.$or = [
      { email: new RegExp(query.search, "i") },
      { name: new RegExp(query.search, "i") },
    ];
  }
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    User.find(filter)
      .select("-passwordHash")
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    User.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function blockUser(id: string, blocked: boolean): Promise<void> {
  await User.updateOne({ _id: id }, { $set: { isBlocked: blocked } });
}

export async function getAuditLog(query: PaginationQuery) {
  const opts = paginationOptions(query);
  const [txs, matches] = await Promise.all([
    CreditTransaction.find({})
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .populate("walletId", "userId")
      .lean(),
    Match.find({ "correctionHistory.0": { $exists: true } })
      .select("matchId tournamentId correctionHistory")
      .sort({ "correctionHistory.at": -1 })
      .limit(50)
      .lean(),
  ]);
  return {
    creditTransactions: txs,
    matchCorrections: matches,
    meta: paginationMeta(await CreditTransaction.countDocuments(), query),
  };
}
