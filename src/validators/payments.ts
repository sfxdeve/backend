import { z } from "zod";

export const createCheckoutBody = z.object({
  packId: z.string().min(1),
});
