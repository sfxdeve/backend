import { z } from "zod";
import { Gender } from "../models/enums.js";

export const createPlayerBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum([Gender.M, Gender.W]),
  nationality: z.string().optional(),
  federationId: z.string().optional(),
});

export const updatePlayerBody = createPlayerBody.partial();

export const playerIdParam = z.object({
  id: z.string().min(1),
});

export const listPlayersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  gender: z.enum([Gender.M, Gender.W]).optional(),
  search: z.string().optional(),
  tournamentId: z.string().optional(),
});

export const adjustPriceBody = z.object({
  currentPrice: z.number().min(0),
});
