import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";
import { Gender } from "../models/enums.js";

export const createSeasonBody = z.object({
  name: z.string().min(1),
  year: z.number().int().positive(),
  gender: z.enum([Gender.M, Gender.W]),
  isActive: z.boolean().optional(),
});

export const updateSeasonBody = createSeasonBody.partial();

export const seasonIdParam = z.object({
  id: z.string().min(1),
});

export const listSeasonsQuery = paginationSchema.merge(
  z.object({
    year: z.coerce.number().int().optional(),
    gender: z.enum([Gender.M, Gender.W]).optional(),
    isActive: z.coerce.boolean().optional(),
  }),
);

export type CreateSeasonBody = z.infer<typeof createSeasonBody>;
export type UpdateSeasonBody = z.infer<typeof updateSeasonBody>;
export type ListSeasonsQuery = z.infer<typeof listSeasonsQuery>;
