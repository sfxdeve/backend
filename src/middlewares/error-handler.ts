import type { NextFunction, Request, Response } from "express";
import { AppError, asAppError, toErrorEnvelope } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  next(
    new AppError(
      "NOT_FOUND",
      `Route not found: ${req.method} ${req.originalUrl}`,
    ),
  );
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const appError = asAppError(error);
  const envelope = toErrorEnvelope({
    code: appError.code,
    message: appError.message,
    details: appError.details,
    traceId: req.traceId,
  });

  if (appError.status >= 500) {
    logger.error(
      {
        traceId: req.traceId,
        path: req.originalUrl,
        code: appError.code,
        error,
      },
      "Unhandled application error",
    );
  } else if (
    appError.status >= 400 &&
    appError.status < 500 &&
    appError.status !== 401 &&
    appError.status !== 404
  ) {
    logger.warn(
      {
        traceId: req.traceId,
        path: req.originalUrl,
        code: appError.code,
        status: appError.status,
      },
      "Client error",
    );
  }

  if (!res.headersSent) {
    res.status(appError.status).json(envelope);
  }
}
