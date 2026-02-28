import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";

export const listTransactionsQuery = paginationSchema;

export type ListTransactionsQuery = z.infer<typeof listTransactionsQuery>;
