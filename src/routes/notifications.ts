import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as notificationsController from "../controllers/notifications.controller.js";
import {
  listNotificationsQuery,
  notificationIdParam,
} from "../validators/notifications.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: listNotificationsQuery }),
  notificationsController.list,
);
router.put(
  "/:id/read",
  requireAuth,
  validateRequest({ params: notificationIdParam }),
  notificationsController.markRead,
);

export default router;
