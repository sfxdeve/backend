import { z } from "zod";

export const setTeamBody = z.object({
  playerIds: z.array(z.string().min(1)),
});

export const tournamentIdParam = z.object({
  tournamentId: z.string().min(1),
});

export type SetTeamBody = z.infer<typeof setTeamBody>;
export type TournamentIdParam = z.infer<typeof tournamentIdParam>;
