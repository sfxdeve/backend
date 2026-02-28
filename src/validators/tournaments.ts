import { z } from "zod";
import { Gender } from "../models/enums.js";

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
  lineupLockAt: z.coerce.date(),
  rosterSize: z.number().int().min(4).max(30).optional(),
  officialUrl: z.string().url().optional().or(z.literal("")),
  scoringTable: scoringTableSchema,
});

export const updateTournamentBody = createTournamentBody.partial();

export const tournamentIdParam = z.object({
  id: z.string().min(1),
});

export const listTournamentsQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  seasonId: z.string().optional(),
  gender: z.enum([Gender.M, Gender.W]).optional(),
  status: z.string().optional(),
});

export const priceParamsBody = z.object({
  priceVolatilityFactor: z.number().min(0).optional(),
  priceFloor: z.number().min(0).optional(),
  priceCap: z.number().min(0).optional(),
});
