import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAuth } from "../../middlewares/auth.js";
import * as service from "./service.js";
import {
  RegisterBodySchema,
  VerifyEmailBodySchema,
  LoginBodySchema,
  RefreshTokenBodySchema,
  LogoutBodySchema,
  ForgotPasswordBodySchema,
  ResetPasswordBodySchema,
} from "./schema.js";

const router = Router();

router.post(
  "/register",
  validateRequest({ body: RegisterBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.register(req.body);

    res.status(201).json(result);
  },
);

router.post(
  "/verify-email",
  validateRequest({ body: VerifyEmailBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.verifyEmail(req.body);

    res.status(200).json(result);
  },
);

router.post(
  "/login",
  validateRequest({ body: LoginBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.login({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json(result);
  },
);

router.post(
  "/refresh",
  requireAuth,
  validateRequest({ body: RefreshTokenBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.refreshTokens({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json(result);
  },
);

router.post(
  "/logout",
  requireAuth,
  validateRequest({ body: LogoutBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.logout({ sessionId: req.auth!.sessionId });

    res.status(200).json(result);
  },
);

router.post(
  "/forgot-password",
  validateRequest({ body: ForgotPasswordBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.forgotPassword(req.body);

    res.status(200).json(result);
  },
);

router.post(
  "/reset-password",
  validateRequest({ body: ResetPasswordBodySchema }),
  async (req: Request, res: Response) => {
    const result = await service.resetPassword(req.body);

    res.status(200).json(result);
  },
);

export default router;
