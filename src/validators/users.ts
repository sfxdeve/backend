import { z } from "zod";

export const updateProfileBody = z.object({
  name: z.string().min(1).optional(),
});

export const changePasswordBody = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const blockUserBody = z.object({
  blocked: z.boolean(),
});

export const userIdParam = z.object({
  id: z.string().min(1),
});

export const listUsersQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
});

export const auditLogQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
