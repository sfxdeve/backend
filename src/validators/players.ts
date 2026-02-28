import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";
import { Gender } from "../models/enums.js";

export const createPlayerBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gender: z.enum([Gender.M, Gender.W]),
  nationality: z.string().optional(),
  federationId: z.string().optional(),
});

export const updatePlayerBody = createPlayerBody.partial();

export const adjustPriceBody = z.object({
  currentPrice: z.number().min(0),
});

export const playerIdParam = z.object({
  id: z.string().min(1),
});

export const listPlayersQuery = paginationSchema.merge(
  z.object({
    gender: z.enum([Gender.M, Gender.W]).optional(),
    search: z.string().optional(),
    tournamentId: z.string().optional(),
    seasonId: z.string().optional(),
  }),
);

export type CreatePlayerBody = z.infer<typeof createPlayerBody>;
export type UpdatePlayerBody = z.infer<typeof updatePlayerBody>;
export type AdjustPriceBody = z.infer<typeof adjustPriceBody>;
export type ListPlayersQuery = z.infer<typeof listPlayersQuery>;
