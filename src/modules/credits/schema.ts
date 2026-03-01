import { z } from "zod";

export const CheckoutBody = z.object({
  creditPackId: z.string().length(24),
});

export const CreateCreditPackBody = z.object({
  name: z.string().min(1).max(100),
  credits: z.number().int().positive(),
  stripePriceId: z.string().min(1),
  active: z.boolean().default(true),
});

export const GrantCreditsBody = z.object({
  userId: z.string().length(24),
  amount: z.number().int().positive(),
  reason: z.string().max(500).optional(),
});

export const WalletQueryParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CheckoutBodyType = z.infer<typeof CheckoutBody>;
export type CreateCreditPackBodyType = z.infer<typeof CreateCreditPackBody>;
export type GrantCreditsBodyType = z.infer<typeof GrantCreditsBody>;
export type WalletQueryParamsType = z.infer<typeof WalletQueryParams>;
