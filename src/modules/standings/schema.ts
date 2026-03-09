import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const StandingsQuerySchema = paginationSchema;
export type StandingsQueryType = z.infer<typeof StandingsQuerySchema>;

export const LeagueParamsSchema = z.object({
  id: z.string().uuid(),
});
export type LeagueParamsType = z.infer<typeof LeagueParamsSchema>;

export const GameweekParamsSchema = z.object({
  id: z.string().uuid(),
  tournamentId: z.string().uuid(),
});
export type GameweekParamsType = z.infer<typeof GameweekParamsSchema>;
