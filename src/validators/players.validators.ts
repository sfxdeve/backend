import { z } from "zod";

export const createPlayerBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  gender: z.enum(["M", "W"]),
  federationId: z.string().optional(),
});

export const updatePlayerBody = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  federationId: z.string().optional(),
});

export const playerIdParam = z.object({
  playerId: z.string().min(1),
});

export const playerListQuery = z.object({
  gender: z.enum(["M", "W"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
