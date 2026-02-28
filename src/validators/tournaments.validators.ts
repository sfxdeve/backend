import { z } from "zod";
import { Gender, TournamentStatus, EntryStatus } from "../models/enums.js";

export const createTournamentBody = z.object({
  seasonId: z.string().min(1),
  name: z.string().min(1).max(200),
  location: z.string().min(1).max(200),
  gender: z.enum([...Gender]),
  isPublic: z.boolean().default(true),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  lineupLockAt: z.string().datetime(),
  rosterSize: z.number().int().min(4).max(30),
  bonusWin2_0: z.number().int().min(0).default(3),
  bonusWin2_1: z.number().int().min(0).default(1),
  officialUrl: z.string().url().optional(),
});

export const updateTournamentBody = z.object({
  name: z.string().min(1).max(200).optional(),
  location: z.string().min(1).max(200).optional(),
  status: z.enum([...TournamentStatus]).optional(),
  isPublic: z.boolean().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  lineupLockAt: z.string().datetime().optional(),
  rosterSize: z.number().int().min(4).max(30).optional(),
  bonusWin2_0: z.number().int().min(0).optional(),
  bonusWin2_1: z.number().int().min(0).optional(),
  officialUrl: z.string().url().optional(),
});

export const tournamentIdParam = z.object({
  tournamentId: z.string().min(1),
});

export const tournamentInviteParams = z.object({
  tournamentId: z.string().min(1),
  userId: z.string().min(1),
});

export const bulkEntriesBody = z.object({
  entries: z.array(
    z.object({
      pairId: z.string().min(1),
      entryStatus: z.enum([...EntryStatus]),
      seedRank: z.number().int().positive().optional(),
      reserveOrder: z.number().int().min(1).max(10).optional(),
    }),
  ),
});
export type BulkEntriesBody = z.infer<typeof bulkEntriesBody>;

export const tournamentListQuery = z.object({
  seasonId: z.string().optional(),
  gender: z.enum([...Gender]).optional(),
  status: z.enum([...TournamentStatus]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
