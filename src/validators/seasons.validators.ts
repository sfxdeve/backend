import { z } from "zod";

export const createSeasonBody = z.object({
  year: z.number().int().min(2000).max(2100),
  label: z.string().min(1).max(50),
  isActive: z.boolean().default(false),
});

export const updateSeasonBody = z.object({
  label: z.string().min(1).max(50).optional(),
  isActive: z.boolean().optional(),
});

export const seasonIdParam = z.object({
  seasonId: z.string().min(1),
});
