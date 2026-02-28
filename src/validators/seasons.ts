import { z } from "zod";
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

export const listSeasonsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  year: z.coerce.number().int().optional(),
  gender: z.enum([Gender.M, Gender.W]).optional(),
  isActive: z.coerce.boolean().optional(),
});
