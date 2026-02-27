import { z } from "zod";

export const bracketListQuery = z.object({
  tournamentId: z.string().min(1),
});
