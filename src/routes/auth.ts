import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import { authRateLimiter, otpRateLimiter } from "../middlewares/rate-limit.js";
import * as authController from "../controllers/auth.controller.js";
import {
  registerBody,
  loginBody,
  verifyEmailBody,
  forgotPasswordBody,
  resetPasswordBody,
  refreshBody,
} from "../validators/auth.js";

const router = Router();

router.post(
  "/register",
  authRateLimiter,
  validateRequest({ body: registerBody }),
  authController.register,
);
router.post(
  "/verify-email",
  validateRequest({ body: verifyEmailBody }),
  authController.verifyEmail,
);
router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: loginBody }),
  authController.login,
);
router.post(
  "/refresh",
  validateRequest({ body: refreshBody }),
  authController.refresh,
);
router.post("/logout", requireAuth, authController.logout);
router.post(
  "/forgot-password",
  otpRateLimiter,
  validateRequest({ body: forgotPasswordBody }),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest({ body: resetPasswordBody }),
  authController.resetPassword,
);

export default router;
