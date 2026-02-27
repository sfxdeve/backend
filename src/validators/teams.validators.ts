import { z } from "zod";

export const saveTeamBody = z.object({
  playerIds: z.array(z.string().min(1)).min(1),
});
