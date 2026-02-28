import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";

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

export const listUsersQuery = paginationSchema.merge(
  z.object({
    search: z.string().optional(),
  }),
);

export const auditLogQuery = paginationSchema.merge(
  z.object({
    type: z.string().optional(),
    tournamentId: z.string().optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  }),
);

export type UpdateProfileBody = z.infer<typeof updateProfileBody>;
export type ChangePasswordBody = z.infer<typeof changePasswordBody>;
export type BlockUserBody = z.infer<typeof blockUserBody>;
export type UserIdParam = z.infer<typeof userIdParam>;
export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type AuditLogQuery = z.infer<typeof auditLogQuery>;
