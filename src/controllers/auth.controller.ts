import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/auth.service.js";
import type {
  ForgotPasswordBody,
  LoginBody,
  RefreshBody,
  RegisterBody,
  ResetPasswordBody,
  VerifyEmailBody,
} from "../validators/auth.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await authService.register(req.body as RegisterBody);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
}

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, code } = req.body as VerifyEmailBody;
    await authService.verifyEmail(userId, code);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body as LoginBody;
    const result = await authService.login(
      email,
      password,
      req.headers["user-agent"],
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { refreshToken } = req.body as RefreshBody;
    const result = await authService.refreshTokens(refreshToken);
    res.json(result);
  } catch (e) {
    next(e);
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
  } catch (e) {
    next(e);
  }
}

export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as ForgotPasswordBody;
    await authService.forgotPassword(email);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}

export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, code, newPassword } = req.body as ResetPasswordBody;
    await authService.resetPassword(userId, code, newPassword);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
}
