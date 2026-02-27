import { Router } from "express";
import { authRateLimiter, otpRateLimiter } from "../middlewares/rate-limit.js";
import { validateRequest } from "../middlewares/validate-request.js";
import { authenticate } from "../middlewares/auth.js";
import * as v from "../validators/auth.validators.js";
import * as ctrl from "../controllers/auth.controller.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateRequest({ body: v.registerBody }),
  ctrl.register,
);

router.post(
  "/verify-email",
  otpRateLimiter,
  validateRequest({ body: v.verifyEmailBody }),
  ctrl.verifyEmail,
);

router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: v.loginBody }),
  ctrl.login,
);

router.post("/refresh", validateRequest({ body: v.refreshBody }), ctrl.refresh);

router.post("/logout", authenticate, ctrl.logout);

router.post(
  "/request-password-reset",
  otpRateLimiter,
  validateRequest({ body: v.requestPasswordResetBody }),
  ctrl.requestPasswordReset,
);

router.post(
  "/reset-password",
  validateRequest({ body: v.resetPasswordBody }),
  ctrl.resetPassword,
);

export default router;
