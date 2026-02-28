import { z } from "zod";

export const createCheckoutBody = z.object({
  packId: z.string().min(1),
});

export type CreateCheckoutBody = z.infer<typeof createCheckoutBody>;
