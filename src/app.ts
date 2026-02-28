import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import crypto from "node:crypto";
import helmet from "helmet";
import cors from "cors";
import * as pinoHttp from "pino-http";
import type { IncomingMessage } from "http";
import "./events/handlers.js";
import { env } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { connectDb, disconnectDb, isDbConnected } from "./lib/db.js";
import { seedAdmin, seedCreditPacks } from "./lib/seed.js";
import {
  defaultRateLimiter,
  stripeWebhookRateLimiter,
} from "./middlewares/rate-limit.js";
import { notFoundHandler, errorHandler } from "./middlewares/error-handler.js";

export async function bootstrap(): Promise<{
  app: Express;
  shutdown: () => Promise<void>;
}> {
  await connectDb();
  await seedAdmin();
  await seedCreditPacks();

  const app = express();

  // Security
  app.use(helmet());

  // CORS
  const corsOrigins = env.CORS_ORIGINS.split(",").map((origin) =>
    origin.trim(),
  );
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // Stripe webhook raw body (must be before express.json)

  // Basic health and readiness probes
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/ready", (_req: Request, res: Response) => {
    if (!isDbConnected()) {
      res.status(503).json({ status: "unavailable", reason: "db" });
      return;
    }
    res.json({ status: "ok" });
  });

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging (set traceId on request so error-handler and logs can use it)
  app.use(
    pinoHttp.pinoHttp({
      logger,
      useLevel: "info",
      genReqId: (req: IncomingMessage) => {
        const r = req as Request;
        r.traceId = r.traceId ?? crypto.randomUUID();
        return r.traceId;
      },
    }),
  );

  // Trust proxy for correct client IPs behind load balancers
  app.set("trust proxy", 1);

  // Rate limiting
  app.use(defaultRateLimiter);

  // API routes

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  const shutdown = async () => {
    await disconnectDb();
  };

  return { app, shutdown };
}
