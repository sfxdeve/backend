import type { Request, Response, NextFunction } from "express";
import expressRateLimit from "express-rate-limit";
import { AppError } from "../lib/errors.js";

function rateLimitHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(
    new AppError(
      "TOO_MANY_REQUESTS",
      "Too many requests, please try again later.",
    ),
  );
}

export const defaultRateLimiter = expressRateLimit({
  limit: 120,
  windowMs: 60 * 1000,
  legacyHeaders: false,
  standardHeaders: true,
  handler: rateLimitHandler,
});

export const authRateLimiter = expressRateLimit({
  limit: 20,
  windowMs: 60 * 1000,
  legacyHeaders: false,
  standardHeaders: true,
  handler: rateLimitHandler,
});

export const otpRateLimiter = expressRateLimit({
  limit: 8,
  windowMs: 60 * 1000,
  legacyHeaders: false,
  standardHeaders: true,
  handler: rateLimitHandler,
});

export const stripeWebhookRateLimiter = expressRateLimit({
  limit: 1000,
  windowMs: 60 * 1000,
  legacyHeaders: false,
  standardHeaders: true,
  handler: rateLimitHandler,
});
