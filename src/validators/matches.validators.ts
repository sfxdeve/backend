import { z } from "zod";

export const createMatchBody = z.object({
  tournamentId: z.string().min(1),
  phase: z.enum([
    "QUALIFICATION",
    "POOL",
    "MAIN_R12",
    "MAIN_QF",
    "MAIN_SF",
    "MAIN_FINAL",
    "MAIN_3RD",
  ]),
  poolGroupId: z.string().optional(),
  poolRound: z.enum(["INITIAL", "WINNERS", "LOSERS"]).optional(),
  bracketSlot: z.string().optional(),
  homeFedFrom: z.string().optional(),
  awayFedFrom: z.string().optional(),
  homePairId: z.string().optional(),
  awayPairId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const updateMatchBody = z.object({
  homePairId: z.string().optional(),
  awayPairId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export const submitResultBody = z.object({
  sets: z
    .array(
      z.object({
        home: z.number().int().min(0),
        away: z.number().int().min(0),
      }),
    )
    .min(2)
    .max(3),
  playedAt: z.string().datetime().optional(),
});

export const matchIdParam = z.object({
  matchId: z.string().min(1),
});

export const matchListQuery = z.object({
  tournamentId: z.string().min(1),
  phase: z
    .enum([
      "QUALIFICATION",
      "POOL",
      "MAIN_R12",
      "MAIN_QF",
      "MAIN_SF",
      "MAIN_FINAL",
      "MAIN_3RD",
    ])
    .optional(),
});
