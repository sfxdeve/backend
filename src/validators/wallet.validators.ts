import { z } from "zod";

export const spendBody = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(1).max(500),
});
export type SpendBody = z.infer<typeof spendBody>;

export const walletUserIdParam = z.object({
  userId: z.string().min(1),
});

export const adjustBody = z.object({
  amount: z
    .number()
    .int()
    .refine((n) => n !== 0, "Amount must be non-zero"),
  reason: z.string().min(1).max(500),
});
export type AdjustBody = z.infer<typeof adjustBody>;
