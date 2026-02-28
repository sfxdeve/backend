import { Notification, NotificationType } from "../models/Notification.js";
import { AppError } from "../lib/errors.js";
import { paginationOptions, paginationMeta } from "../lib/pagination.js";
import type { PaginationQuery } from "../lib/pagination.js";

export async function createNotification(
  userId: string,
  type: NotificationType,
  payload?: unknown,
): Promise<void> {
  await Notification.create({ userId, type, payload });
}

export async function getUserNotifications(
  userId: string,
  query: PaginationQuery,
) {
  const filter = { userId, read: false };
  const opts = paginationOptions(query);
  const [items, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(opts.skip)
      .limit(opts.limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);
  return { items, meta: paginationMeta(total, query) };
}

export async function markRead(
  notificationId: string,
  userId: string,
): Promise<void> {
  const result = await Notification.updateOne(
    { _id: notificationId, userId },
    { $set: { read: true } },
  );
  if (result.matchedCount === 0)
    throw new AppError("NOT_FOUND", "Notification not found");
}
