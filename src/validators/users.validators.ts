import { z } from "zod";

export const updateMeBody = z.object({
  name: z.string().min(1).max(100),
});

export const userIdParam = z.object({
  userId: z.string().min(1),
});

export const blockUserBody = z.object({
  isBlocked: z.boolean(),
});

export const userListQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
