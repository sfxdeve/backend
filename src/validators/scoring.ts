import { z } from "zod";

export const leagueIdParam = z.object({
  leagueId: z.string().min(1),
});

export const playerScoresQuery = z.object({
  tournamentId: z.string().min(1),
  playerId: z.string().optional(),
});

export type LeagueIdParam = z.infer<typeof leagueIdParam>;
export type PlayerScoresQuery = z.infer<typeof playerScoresQuery>;
