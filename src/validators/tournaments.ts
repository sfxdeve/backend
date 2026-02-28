import { z } from "zod";
import { toZonedTime } from "date-fns-tz";
import { paginationSchema } from "../lib/pagination.js";
import { Gender } from "../models/enums.js";

const ROME_TZ = "Europe/Rome";

/**
 * Validates that the given Date (in UTC) corresponds to Thursday 23:59 in Europe/Rome.
 * Spec §3.4 + §4: registration_locked = Thursday 23:59 Europe/Rome.
 */
function isThursdayMidnight(date: Date): boolean {
  const zoned = toZonedTime(date, ROME_TZ);
  return (
    zoned.getDay() === 4 && zoned.getHours() === 23 && zoned.getMinutes() === 59
  );
}

const lineupLockAtSchema = z.coerce.date().refine(isThursdayMidnight, {
  message: "lineupLockAt must be Thursday 23:59 Europe/Rome",
});

const scoringTableSchema = z
  .object({
    QUALIFICATION: z.number().optional(),
    POOL: z.number().optional(),
    MAIN_R12: z.number().optional(),
    MAIN_QF: z.number().optional(),
    MAIN_SF: z.number().optional(),
    MAIN_3RD: z.number().optional(),
    MAIN_FINAL: z.number().optional(),
    bonusWin2_0: z.number().optional(),
    bonusWin2_1: z.number().optional(),
  })
  .optional();

export const createTournamentBody = z.object({
  seasonId: z.string().min(1),
  name: z.string().min(1),
  location: z.string().min(1),
  gender: z.enum([Gender.M, Gender.W]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  lineupLockAt: lineupLockAtSchema,
  rosterSize: z.number().int().min(4).max(30).optional(),
  officialUrl: z.url().optional().or(z.literal("")),
  scoringTable: scoringTableSchema,
});

export const updateTournamentBody = createTournamentBody.partial();

export const tournamentIdParam = z.object({
  id: z.string().min(1),
});

export const listTournamentsQuery = paginationSchema.merge(
  z.object({
    seasonId: z.string().optional(),
    gender: z.enum([Gender.M, Gender.W]).optional(),
    status: z.string().optional(),
  }),
);

export type CreateTournamentBody = z.infer<typeof createTournamentBody>;
export type UpdateTournamentBody = z.infer<typeof updateTournamentBody>;
export type ListTournamentsQuery = z.infer<typeof listTournamentsQuery>;
