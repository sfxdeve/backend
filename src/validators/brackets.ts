import { z } from "zod";

export const tournamentIdQuery = z.object({
  tournamentId: z.string().min(1),
});

export type TournamentIdQuery = z.infer<typeof tournamentIdQuery>;
