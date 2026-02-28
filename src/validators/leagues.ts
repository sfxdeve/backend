import { z } from "zod";
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

export const listLeaguesQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tournamentId: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  status: z.string().optional(),
});
