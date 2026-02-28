import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";
import { LeagueGameMode } from "../models/enums.js";

export const createLeagueBody = z.object({
  tournamentId: z.string().min(1),
  name: z.string().min(1),
  isPublic: z.boolean(),
  gameMode: z
    .enum([LeagueGameMode.CLASSIC, LeagueGameMode.HEAD_TO_HEAD])
    .optional(),
  entryFee: z.number().min(0).optional(),
  maxMembers: z.number().int().positive().optional(),
});

export const joinLeagueBody = z.object({
  inviteCode: z.string().optional(),
});

export const updateLeagueBody = z.object({
  name: z.string().min(1).optional(),
  isPublic: z.boolean().optional(),
  maxMembers: z.number().int().positive().optional(),
});

export const leagueIdParam = z.object({
  id: z.string().min(1),
});

export const listLeaguesQuery = paginationSchema.merge(
  z.object({
    tournamentId: z.string().optional(),
    isPublic: z.coerce.boolean().optional(),
    status: z.string().optional(),
  }),
);

export type CreateLeagueBody = z.infer<typeof createLeagueBody>;
export type JoinLeagueBody = z.infer<typeof joinLeagueBody>;
export type UpdateLeagueBody = z.infer<typeof updateLeagueBody>;
export type ListLeaguesQuery = z.infer<typeof listLeaguesQuery>;
