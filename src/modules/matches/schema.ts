import { z } from "zod";
import { MatchRound, MatchStatus } from "../../prisma/generated/enums.js";
import { paginationSchema } from "../../lib/pagination.js";

export const MatchQuerySchema = z.object({
  ...paginationSchema.shape,
  round: z
    .enum(
      MatchRound,
      `Round must be one of ${Object.values(MatchRound).join(", ")}`,
    )
    .optional(),
  status: z
    .enum(
      MatchStatus,
      `Status must be one of ${Object.values(MatchStatus).join(", ")}`,
    )
    .optional(),
  tournamentId: z.uuid("Tournament ID must be a valid UUID").optional(),
});

export const MatchParamsSchema = z.object({
  id: z.uuid("ID must be a valid UUID"),
});

export const CreateMatchBodySchema = z.object({
  round: z.enum(
    MatchRound,
    `Round must be one of ${Object.values(MatchRound).join(", ")}`,
  ),
  scheduledAt: z.coerce.date().optional(),
  tournamentId: z.uuid("Tournament ID must be a valid UUID"),
  pairAId: z.uuid("Pair A ID must be a valid UUID"),
  pairBId: z.uuid("Pair B ID must be a valid UUID"),
});

export const UpdateMatchBodySchema = z.object({
  set1A: z
    .number("Set 1 A must be a number")
    .int("Set 1 A must be an integer")
    .min(0, "Set 1 A must be at least 0")
    .optional(),
  set1B: z
    .number("Set 1 B must be a number")
    .int("Set 1 B must be an integer")
    .min(0, "Set 1 B must be at least 0")
    .optional(),
  set2A: z
    .number("Set 2 A must be a number")
    .int("Set 2 A must be an integer")
    .min(0, "Set 2 A must be at least 0")
    .optional(),
  set2B: z
    .number("Set 2 B must be a number")
    .int("Set 2 B must be an integer")
    .min(0, "Set 2 B must be at least 0")
    .optional(),
  set3A: z
    .number("Set 3 A must be a number")
    .int("Set 3 A must be an integer")
    .min(0, "Set 3 A must be at least 0")
    .optional(),
  set3B: z
    .number("Set 3 B must be a number")
    .int("Set 3 B must be an integer")
    .min(0, "Set 3 B must be at least 0")
    .optional(),
  status: z
    .enum(
      MatchStatus,
      `Status must be one of ${Object.values(MatchStatus).join(", ")}`,
    )
    .optional(),
  scheduledAt: z.coerce.date().optional(),
  winnerPairId: z
    .uuid("Winner pair ID must be a valid UUID")
    .nullable()
    .optional(),
  reason: z
    .string("Reason must be a string")
    .max(256, "Reason must be at most 256 characters")
    .optional(),
});

export type MatchQueryType = z.infer<typeof MatchQuerySchema>;

export type MatchParamsType = z.infer<typeof MatchParamsSchema>;

export type CreateMatchBodyType = z.infer<typeof CreateMatchBodySchema>;

export type UpdateMatchBodyType = z.infer<typeof UpdateMatchBodySchema>;
