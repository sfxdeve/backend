import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";
import { MatchPhase, MatchResult } from "../models/enums.js";

const setSchema = z.object({
  home: z.number().int().min(0),
  away: z.number().int().min(0),
});

export const createMatchBody = z.object({
  tournamentId: z.string().min(1),
  phase: z.enum([
    MatchPhase.QUALIFICATION,
    MatchPhase.POOL,
    MatchPhase.MAIN_R12,
    MatchPhase.MAIN_QF,
    MatchPhase.MAIN_SF,
    MatchPhase.MAIN_FINAL,
    MatchPhase.MAIN_3RD,
  ]),
  scheduledAt: z.coerce.date(),
  bracketSlot: z.number().int().min(0).optional(),
  poolGroupId: z.string().optional(),
  poolRound: z.string().optional(),
});

export const updateScoreBody = z.object({
  sets: z.array(setSchema).min(1),
  result: z.enum([
    MatchResult.WIN_2_0,
    MatchResult.WIN_2_1,
    MatchResult.LOSS_0_2,
    MatchResult.LOSS_1_2,
  ]),
});

export const matchIdParam = z.object({
  id: z.string().min(1),
});

export const listMatchesQuery = paginationSchema.merge(
  z.object({
    tournamentId: z.string().min(1),
    phase: z.string().optional(),
    status: z.string().optional(),
  }),
);

export type CreateMatchBody = z.infer<typeof createMatchBody>;
export type UpdateScoreBody = z.infer<typeof updateScoreBody>;
export type ListMatchesQuery = z.infer<typeof listMatchesQuery>;
