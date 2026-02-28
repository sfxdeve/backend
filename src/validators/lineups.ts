import { z } from "zod";

export const setLineupBody = z.object({
  starters: z.array(z.string().min(1)).length(4),
  reserves: z.array(z.string().min(1)).length(3),
});

export const tournamentIdParam = z.object({
  tournamentId: z.string().min(1),
});
