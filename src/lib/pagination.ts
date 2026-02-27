import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;

export function paginationOptions(query: PaginationQuery) {
  return {
    skip: (query.page - 1) * query.limit,
    limit: query.limit,
  };
}

export function paginationMeta(total: number, query: PaginationQuery) {
  return {
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit),
  };
}
