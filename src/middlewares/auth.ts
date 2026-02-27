import type { Request, Response, NextFunction } from "express";
import { extractBearerToken, verifyAccessToken } from "../lib/jwt.js";
import { validateSession } from "../lib/session.js";
import { AppError } from "../lib/errors.js";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) {
    return next(new AppError("UNAUTHORIZED", "Authentication required"));
  }

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return next(err);
  }

  let sessionActive: boolean;
  try {
    sessionActive = await validateSession(payload.sessionId);
  } catch (err) {
    return next(err);
  }
  if (!sessionActive) {
    return next(new AppError("UNAUTHORIZED", "Session expired or revoked"));
  }

  req.auth = {
    userId: payload.sub,
    role: payload.role,
    sessionId: payload.sessionId,
  };
  next();
}

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.auth?.role !== "ADMIN") {
    return next(new AppError("FORBIDDEN", "Admin access required"));
  }
  next();
}

// Optional auth: populates req.auth if token present, but does not require it
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const token = extractBearerToken(req);
  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    const sessionActive = await validateSession(payload.sessionId);
    if (sessionActive) {
      req.auth = {
        userId: payload.sub,
        role: payload.role,
        sessionId: payload.sessionId,
      };
    }
  } catch {
    // Silently ignore invalid tokens for optional auth
  }
  next();
}
