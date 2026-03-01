import { AdminAuditLog } from "../../models/Admin.js";
import { paginationMeta } from "../../lib/pagination.js";
import type { AuditLogQueryParamsType } from "./schema.js";

export async function getAuditLog(query: AuditLogQueryParamsType) {
  const filter: Record<string, unknown> = {};
  if (query.adminId) filter.adminId = query.adminId;
  if (query.entity) filter.entity = query.entity;
  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from)
      (filter.createdAt as Record<string, unknown>).$gte = query.from;
    if (query.to) (filter.createdAt as Record<string, unknown>).$lte = query.to;
  }

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .populate("adminId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(query.limit)
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  return {
    items,
    meta: paginationMeta(total, { page: query.page, limit: query.limit }),
  };
}
