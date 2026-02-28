import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";
import { AuditLogType } from "../models/AuditLog.js";

export const priceParamsBody = z.object({
  tournamentId: z.string().min(1),
  priceVolatilityFactor: z.number().min(0).optional(),
  priceFloor: z.number().min(0).optional(),
  priceCap: z.number().min(0).optional(),
});

export const adminLogsQuery = paginationSchema.merge(
  z.object({
    type: z.enum(Object.values(AuditLogType) as [string, ...string[]]).optional(),
    tournamentId: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
);

export type PriceParamsBody = z.infer<typeof priceParamsBody>;
export type AdminLogsQuery = z.infer<typeof adminLogsQuery>;
