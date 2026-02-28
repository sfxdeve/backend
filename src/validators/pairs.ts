import { z } from "zod";

export const createPairBody = z.object({
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
});

export const pairIdParam = z.object({
  id: z.string().min(1),
});

export const tournamentIdQuery = z.object({
  tournamentId: z.string().min(1),
});

export type CreatePairBody = z.infer<typeof createPairBody>;
export type TournamentIdQuery = z.infer<typeof tournamentIdQuery>;
