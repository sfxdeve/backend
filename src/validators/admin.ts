import { z } from "zod";
import { AuditLogType } from "../models/AuditLog.js";

export const adminLogsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(Object.values(AuditLogType) as [string, ...string[]]).optional(),
  tournamentId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const priceParamsBody = z.object({
  tournamentId: z.string().min(1),
  priceVolatilityFactor: z.number().min(0).optional(),
  priceFloor: z.number().min(0).optional(),
  priceCap: z.number().min(0).optional(),
});
