import { z } from "zod";

export const leagueListQuery = z.object({
  isPublic: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  tournamentId: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const createLeagueBody = z
  .object({
    tournamentId: z.string().min(1),
    name: z.string().min(1).max(200),
    startDate: z.string().datetime(),
    isPublic: z.boolean().default(true),
    inviteCode: z.string().min(1).max(50).optional(),
    playerAvailability: z.string().max(50).optional(),
    gameMode: z.string().max(50).optional(),
    typology: z.string().max(50).optional(),
    banner: z.string().url().optional(),
  })
  .strict();
export type CreateLeagueBody = z.infer<typeof createLeagueBody>;

export const leagueIdParam = z.object({
  leagueId: z.string().min(1),
});

export const joinByCodeBody = z.object({
  inviteCode: z.string().min(1).max(50),
});
export type JoinByCodeBody = z.infer<typeof joinByCodeBody>;
