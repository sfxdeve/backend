import { z } from "zod";
import { paginationSchema } from "../lib/pagination.js";

export const listNotificationsQuery = paginationSchema;

export const notificationIdParam = z.object({
  id: z.string().min(1),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuery>;
export type NotificationIdParam = z.infer<typeof notificationIdParam>;
