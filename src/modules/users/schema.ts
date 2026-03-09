import { z } from "zod";
import { paginationSchema } from "../../lib/pagination.js";

export const UsersQuerySchema = z.object({
  ...paginationSchema.shape,
  email: z.string("Email must be a string").optional(),
  isBlocked: z
    .enum(["true", "false"], "isBlocked must be 'true' or 'false'")
    .transform((v) => v === "true")
    .optional(),
});
export type UsersQueryType = z.infer<typeof UsersQuerySchema>;

export const UserParamsSchema = z.object({
  id: z.uuid("ID must be a valid UUID"),
});
export type UserParamsType = z.infer<typeof UserParamsSchema>;

export const UpdateUserBodySchema = z
  .object({
    isBlocked: z.boolean("isBlocked must be a boolean").optional(),
    role: z.enum(["USER", "ADMIN"], "Role must be USER or ADMIN").optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field required",
  });
export type UpdateUserBodyType = z.infer<typeof UpdateUserBodySchema>;
