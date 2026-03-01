import { z } from "zod";
import { Gender } from "../../models/enums.js";

export const CreateAthleteBody = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  gender: z.enum([Gender.M, Gender.F]),
  championshipId: z.string().length(24),
  pictureUrl: z.url().optional(),
  entryPoints: z.number().min(0).default(0),
  globalPoints: z.number().min(0).default(0),
  fantacoinCost: z.number().min(0).default(0),
});

export const UpdateAthleteBody = CreateAthleteBody.partial();

export const AthleteQueryParams = z.object({
  championshipId: z.string().length(24).optional(),
  gender: z.enum([Gender.M, Gender.F]).optional(),
  search: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateAthleteBodyType = z.infer<typeof CreateAthleteBody>;
export type UpdateAthleteBodyType = z.infer<typeof UpdateAthleteBody>;
export type AthleteQueryParamsType = z.infer<typeof AthleteQueryParams>;
