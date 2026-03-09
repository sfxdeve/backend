import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const MatchQuerySchema = paginationSchema;
export type MatchQueryType = z.infer<typeof MatchQuerySchema>;

export const TournamentParamsSchema = z.object({
  id: z.string().uuid(),
});
export type TournamentParamsType = z.infer<typeof TournamentParamsSchema>;

export const MatchParamsSchema = z.object({
  id: z.string().uuid(),
});
export type MatchParamsType = z.infer<typeof MatchParamsSchema>;

const ROUNDS = [
  "QUALIFICATION_R1",
  "QUALIFICATION_R2",
  "POOL",
  "R12",
  "QF",
  "SF",
  "FINAL",
  "THIRD_PLACE",
] as const;

export const CreateMatchBodySchema = z.object({
  tournamentId: z.string().uuid(),
  round: z.enum(ROUNDS),
  scheduledAt: z.coerce.date(),
  sideAAthlete1Id: z.string().uuid(),
  sideAAthlete2Id: z.string().uuid(),
  sideBAthlete1Id: z.string().uuid(),
  sideBAthlete2Id: z.string().uuid(),
});
export type CreateMatchBodyType = z.infer<typeof CreateMatchBodySchema>;

export const UpdateMatchBodySchema = z
  .object({
    round: z.enum(ROUNDS).optional(),
    scheduledAt: z.coerce.date().optional(),
    sideAAthlete1Id: z.string().uuid().optional(),
    sideAAthlete2Id: z.string().uuid().optional(),
    sideBAthlete1Id: z.string().uuid().optional(),
    sideBAthlete2Id: z.string().uuid().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field required",
  });
export type UpdateMatchBodyType = z.infer<typeof UpdateMatchBodySchema>;

export const MatchResultBodySchema = z
  .object({
    set1A: z.number().int().min(0),
    set1B: z.number().int().min(0),
    set2A: z.number().int().min(0),
    set2B: z.number().int().min(0),
    set3A: z.number().int().min(0).optional(),
    set3B: z.number().int().min(0).optional(),
    winnerSide: z.enum(["A", "B"]),
  })
  .refine(
    (d) => {
      const hasTiebreak = d.set3A !== undefined && d.set3B !== undefined;
      const eitherHas = d.set3A !== undefined || d.set3B !== undefined;
      return hasTiebreak || !eitherHas;
    },
    { message: "set3A and set3B must both be provided or both omitted" },
  );
export type MatchResultBodyType = z.infer<typeof MatchResultBodySchema>;

// ─── Import ───────────────────────────────────────────────────────────────────

const ImportMatchRowSchema = z.object({
  tournamentId: z.string().uuid(),
  round: z.enum(ROUNDS),
  scheduledAt: z.coerce.date(),
  sideAAthlete1Id: z.string().uuid(),
  sideAAthlete2Id: z.string().uuid(),
  sideBAthlete1Id: z.string().uuid(),
  sideBAthlete2Id: z.string().uuid(),
  // Optional result fields — all must be present together to enter result
  set1A: z.number().int().min(0).optional(),
  set1B: z.number().int().min(0).optional(),
  set2A: z.number().int().min(0).optional(),
  set2B: z.number().int().min(0).optional(),
  set3A: z.number().int().min(0).optional(),
  set3B: z.number().int().min(0).optional(),
  winnerSide: z.enum(["A", "B"]).optional(),
});
export type ImportMatchRowType = z.infer<typeof ImportMatchRowSchema>;

export const ImportMatchesBodySchema = z.object({
  rows: z.array(ImportMatchRowSchema).min(1).max(500),
});
export type ImportMatchesBodyType = z.infer<typeof ImportMatchesBodySchema>;
