import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const AthleteQuerySchema = z.object({
  ...paginationSchema.shape,
});
export type AthleteQueryType = z.infer<typeof AthleteQuerySchema>;

export const ChampionshipParamsSchema = z.object({
  id: z.uuid("ID must be a valid UUID"),
});
export type ChampionshipParamsType = z.infer<typeof ChampionshipParamsSchema>;

export const AthleteParamsSchema = z.object({
  id: z.uuid("ID must be a valid UUID"),
});
export type AthleteParamsType = z.infer<typeof AthleteParamsSchema>;

export const CreateAthleteBodySchema = z.object({
  firstName: z
    .string("First name must be a string")
    .min(1, "First name must be at least 1 character")
    .max(64, "First name must be at most 64 characters"),
  lastName: z
    .string("Last name must be a string")
    .min(1, "Last name must be at least 1 character")
    .max(64, "Last name must be at most 64 characters"),
  gender: z.enum(["MALE", "FEMALE"], "Gender must be one of MALE, FEMALE"),
  rank: z
    .number("Rank must be a number")
    .int("Rank must be an integer")
    .min(1, "Rank must be at least 1"),
  championshipId: z.uuid("Championship ID must be a valid UUID"),
});
export type CreateAthleteBodyType = z.infer<typeof CreateAthleteBodySchema>;

export const UpdateAthleteBodySchema = z.object({
  firstName: z
    .string("First name must be a string")
    .min(1, "First name must be at least 1 character")
    .max(64, "First name must be at most 64 characters")
    .optional(),
  lastName: z
    .string("Last name must be a string")
    .min(1, "Last name must be at least 1 character")
    .max(64, "Last name must be at most 64 characters")
    .optional(),
  rank: z
    .number("Rank must be a number")
    .int("Rank must be an integer")
    .min(1, "Rank must be at least 1")
    .optional(),
});
export type UpdateAthleteBodyType = z.infer<typeof UpdateAthleteBodySchema>;

// Used for per-row validation when parsing an uploaded CSV / Excel file.
// rank uses coerce so that string values from CSV ("5") are also accepted.
export const AthleteImportRowSchema = z.object({
  firstName: z
    .string("First name must be a string")
    .min(1, "First name must be at least 1 character")
    .max(64, "First name must be at most 64 characters"),
  lastName: z
    .string("Last name must be a string")
    .min(1, "Last name must be at least 1 character")
    .max(64, "Last name must be at most 64 characters"),
  gender: z.enum(["MALE", "FEMALE"], "Gender must be one of MALE, FEMALE"),
  rank: z.coerce
    .number("Rank must be a number")
    .int("Rank must be an integer")
    .min(1, "Rank must be at least 1"),
  championshipId: z.uuid("Championship ID must be a valid UUID"),
});
export type AthleteImportRowType = z.infer<typeof AthleteImportRowSchema>;
