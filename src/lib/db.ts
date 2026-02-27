import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export async function connectDb(retryCount = 5): Promise<void> {
  let attempts = 0;
  let lastError: unknown;

  while (attempts < retryCount) {
    try {
      await mongoose.connect(env.MONGO_URI);

      return;
    } catch (error) {
      attempts += 1;
      lastError = error;

      logger.warn(
        {
          attempt: attempts,
          retryCount,
          error,
        },
        "Failed to connect to MongoDB, will retry",
      );

      await new Promise((resolve) => setTimeout(resolve, attempts * 500));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to connect to MongoDB");
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDb(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
