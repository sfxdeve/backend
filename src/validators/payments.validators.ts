import { z } from "zod";

export const createIntentBody = z.object({
  packId: z.string().min(1),
});
export type CreateIntentBody = z.infer<typeof createIntentBody>;
