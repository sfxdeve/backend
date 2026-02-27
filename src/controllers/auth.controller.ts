import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.register(req.body);
    res.status(201).json({ message: "Verification code sent to your email" });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.verifyEmail(req.body);
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.login({
      ...req.body,
      userAgent: req.headers["user-agent"],
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.refresh(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.logout(req.auth!.sessionId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.requestPasswordReset(req.body);
    res.json({
      message: "If that email is registered, a reset code has been sent",
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await authService.resetPassword(req.body);
    res.json({ message: "Password reset successfully" });
  } catch (err) {
    next(err);
  }
}
