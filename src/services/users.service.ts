import { AuditLog } from "../models/AuditLog.js";
import { User } from "../models/User.js";
import { AppError } from "../lib/errors.js";
import { compareSecret, hashSecret } from "../lib/hash.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import { revokeAllUserSessions } from "../lib/session.js";
import type { UpdateProfileBody, ChangePasswordBody, ListUsersQuery, AuditLogQuery } from "../validators/users.js";

export async function getProfile(userId: string) {
  const user = await User.findById(userId).select("-passwordHash").lean();
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  return user;
}

export async function updateProfile(
  userId: string,
  body: UpdateProfileBody,
): Promise<void> {
  const update: Record<string, string> = {};
  if (body.name != null) update.name = body.name;
  if (Object.keys(update).length === 0) return;
  await User.updateOne({ _id: userId }, { $set: update });
}

export async function changePassword(
  userId: string,
  body: ChangePasswordBody,
): Promise<void> {
  const user = await User.findById(userId);
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  const ok = await compareSecret(body.oldPassword, user.passwordHash);
  if (!ok) throw new AppError("BAD_REQUEST", "Invalid current password");
  const passwordHash = await hashSecret(body.newPassword);
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
  await revokeAllUserSessions(userId.toString());
}

export async function list(query: ListUsersQuery) {
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

export async function getAuditLog(query: AuditLogQuery) {
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.tournamentId) filter.tournamentId = query.tournamentId;
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: query.from } : {}),
      ...(query.to ? { $lte: query.to } : {}),
    };
  }
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    AuditLog.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}
