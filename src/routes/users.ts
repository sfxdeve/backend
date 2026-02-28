import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as usersController from "../controllers/users.controller.js";
import * as notificationsController from "../controllers/notifications.controller.js";
import {
  updateProfileBody,
  changePasswordBody,
  blockUserBody,
  userIdParam,
  listUsersQuery,
  auditLogQuery,
  notificationIdParam,
} from "../validators/users.js";

const router = Router();

router.get("/me", requireAuth, usersController.getProfile);
router.put(
  "/me",
  requireAuth,
  validateRequest({ body: updateProfileBody }),
  usersController.updateProfile,
);
router.put(
  "/me/password",
  requireAuth,
  validateRequest({ body: changePasswordBody }),
  usersController.changePassword,
);
router.get(
  "/logs",
  requireAdmin,
  validateRequest({ query: auditLogQuery }),
  usersController.getAuditLog,
);
router.get(
  "/",
  requireAdmin,
  validateRequest({ query: listUsersQuery }),
  usersController.listUsers,
);
router.put(
  "/:id/block",
  requireAdmin,
  validateRequest({ params: userIdParam, body: blockUserBody }),
  usersController.blockUser,
);

// Notification routes
router.get("/notifications", requireAuth, notificationsController.list);
router.put(
  "/notifications/:id/read",
  requireAuth,
  validateRequest({ params: notificationIdParam }),
  notificationsController.markRead,
);

export default router;
