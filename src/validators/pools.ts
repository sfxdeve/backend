import { z } from "zod";
import { Gender } from "../models/enums.js";

export const createGroupBody = z.object({
  name: z.string().min(1),
  gender: z.enum([Gender.M, Gender.W]),
});

export const tournamentIdQuery = z.object({
  tournamentId: z.string().min(1),
});

export const groupIdParam = z.object({
  groupId: z.string().min(1),
});

export const assignPairBody = z.object({
  pairId: z.string().min(1),
});
