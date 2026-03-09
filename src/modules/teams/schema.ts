import { z } from "zod";

export const LeagueParamsSchema = z.object({
  id: z.string().uuid(),
});
export type LeagueParamsType = z.infer<typeof LeagueParamsSchema>;

export const LineupParamsSchema = z.object({
  id: z.string().uuid(),
  tournamentId: z.string().uuid(),
});
export type LineupParamsType = z.infer<typeof LineupParamsSchema>;

export const SaveRosterBodySchema = z.object({
  athleteIds: z.array(z.string().uuid()).min(1),
});
export type SaveRosterBodyType = z.infer<typeof SaveRosterBodySchema>;

const LineupSlotSchema = z.object({
  athleteId: z.string().uuid(),
  role: z.enum(["STARTER", "BENCH"]),
  benchOrder: z.number().int().min(1).optional(),
});

export const SaveLineupBodySchema = z.object({
  slots: z.array(LineupSlotSchema).min(1),
});
export type SaveLineupBodyType = z.infer<typeof SaveLineupBodySchema>;
