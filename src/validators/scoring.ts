import { z } from "zod";

export const playerScoresQuery = z.object({
  tournamentId: z.string().min(1),
  playerId: z.string().optional(),
});

export const leagueIdParam = z.object({
  leagueId: z.string().min(1),
});
