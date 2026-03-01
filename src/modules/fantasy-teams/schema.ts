import { z } from "zod";
import { LineupRole } from "../../models/enums.js";

export const SubmitRosterBody = z.object({
  athleteIds: z.array(z.string().length(24)).min(1),
});

export const UpdateRosterBody = z.object({
  sell: z.array(z.string().length(24)).default([]),
  buy: z.array(z.string().length(24)).default([]),
});

export const LineupSlotInput = z.object({
  athleteId: z.string().length(24),
  role: z.nativeEnum(LineupRole),
  benchOrder: z.number().int().positive().optional(),
});

export const SubmitLineupBody = z.object({
  slots: z.array(LineupSlotInput).min(1),
});

export type SubmitRosterBodyType = z.infer<typeof SubmitRosterBody>;
export type UpdateRosterBodyType = z.infer<typeof UpdateRosterBody>;
export type SubmitLineupBodyType = z.infer<typeof SubmitLineupBody>;
