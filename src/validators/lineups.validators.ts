import { z } from "zod";

export const saveLineupBody = z
  .object({
    starters: z.array(z.string().min(1)).length(4),
    reserves: z.array(z.string().min(1)).length(3),
  })
  .refine((data) => new Set([...data.starters, ...data.reserves]).size === 7, {
    message: "Starters and reserves must all be unique",
  });
