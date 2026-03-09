import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const TournamentQuerySchema = paginationSchema;
export type TournamentQueryType = z.infer<typeof TournamentQuerySchema>;

export const ChampionshipParamsSchema = z.object({
  id: z.string().uuid(),
});
export type ChampionshipParamsType = z.infer<typeof ChampionshipParamsSchema>;

export const TournamentParamsSchema = z.object({
  id: z.string().uuid(),
});
export type TournamentParamsType = z.infer<typeof TournamentParamsSchema>;

export const CreateTournamentBodySchema = z.object({
  championshipId: z.string().uuid(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  lineupLockAt: z.coerce.date().optional(),
});
export type CreateTournamentBodyType = z.infer<
  typeof CreateTournamentBodySchema
>;

const TOURNAMENT_STATUSES = [
  "UPCOMING",
  "REGISTRATION_OPEN",
  "LOCKED",
  "ONGOING",
  "COMPLETED",
] as const;

export const UpdateTournamentBodySchema = z
  .object({
    status: z.enum(TOURNAMENT_STATUSES).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    lineupLockAt: z.coerce.date().nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field required",
  });
export type UpdateTournamentBodyType = z.infer<
  typeof UpdateTournamentBodySchema
>;

export const LineupLockOverrideBodySchema = z.object({
  lineupLockAt: z.coerce.date(),
  reason: z.string().max(256).optional(),
});
export type LineupLockOverrideBodyType = z.infer<
  typeof LineupLockOverrideBodySchema
>;
