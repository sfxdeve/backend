import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/users.validators.js";
import * as ctrl from "../controllers/users.controller.js";

const router = Router();

router.get("/me", authenticate, ctrl.getMe);
router.patch(
  "/me",
  authenticate,
  validateRequest({ body: v.updateMeBody }),
  ctrl.updateMe,
);
router.get(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ query: v.userListQuery }),
  ctrl.listUsers,
);
router.patch(
  "/:userId/block",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.userIdParam, body: v.blockUserBody }),
  ctrl.blockUser,
);

export default router;
