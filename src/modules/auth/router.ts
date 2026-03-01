import { Router, type Request, type Response, type NextFunction } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth } from "../../middlewares/auth.js";
import { authRateLimiter, otpRateLimiter } from "../../middlewares/rate-limit.js";
import { env } from "../../lib/env.js";
import { AppError } from "../../lib/errors.js";
import * as service from "./service.js";
import {
  RegisterBody,
  VerifyEmailBody,
  LoginBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "./schema.js";

const router = Router();

const REFRESH_COOKIE = "refreshToken";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

router.post(
  "/register",
  authRateLimiter,
  validateRequest({ body: RegisterBody }),
  async (req: Request, res: Response) => {
    const result = await service.register(req.body);
    res.status(201).json({ success: true, data: result });
  },
);

router.post(
  "/verify-email",
  otpRateLimiter,
  validateRequest({ body: VerifyEmailBody }),
  async (req: Request, res: Response) => {
    const result = await service.verifyEmail(req.body);
    res.json({ success: true, data: result });
  },
);

router.post(
  "/login",
  authRateLimiter,
  validateRequest({ body: LoginBody }),
  async (req: Request, res: Response) => {
    const userAgent = req.headers["user-agent"];
    const result = await service.login(req.body, userAgent);
    res
      .cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
      .json({ success: true, data: { accessToken: result.accessToken, user: result.user } });
  },
);

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) {
      next(new AppError("UNAUTHORIZED", "No refresh token"));
      return;
    }
    const userAgent = req.headers["user-agent"];
    const result = await service.refreshTokens(token, userAgent);
    res
      .cookie(REFRESH_COOKIE, result.refreshToken, COOKIE_OPTS)
      .json({ success: true, data: { accessToken: result.accessToken } });
  },
);

router.post(
  "/logout",
  requireAuth,
  async (req: Request, res: Response) => {
    await service.logout(req.auth!.sessionId);
    res.clearCookie(REFRESH_COOKIE).json({ success: true, data: { message: "Logged out" } });
  },
);

router.post(
  "/forgot-password",
  authRateLimiter,
  validateRequest({ body: ForgotPasswordBody }),
  async (req: Request, res: Response) => {
    const result = await service.forgotPassword(req.body);
    res.json({ success: true, data: result });
  },
);

router.post(
  "/reset-password",
  authRateLimiter,
  validateRequest({ body: ResetPasswordBody }),
  async (req: Request, res: Response) => {
    const result = await service.resetPassword(req.body);
    res.json({ success: true, data: result });
  },
);

export default router;
