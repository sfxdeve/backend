import { z } from "zod";

export const createPairBody = z.object({
  tournamentId: z.string().min(1),
  player1Id: z.string().min(1),
  player2Id: z.string().min(1),
});

export const pairIdParam = z.object({
  pairId: z.string().min(1),
});

export const pairListQuery = z.object({
  tournamentId: z.string().min(1),
});
