import jwt, { type SignOptions } from "jsonwebtoken";
import type { Request } from "express";
import { env } from "./env.js";
import { AppError } from "./errors.js";

export interface AccessTokenPayload {
  sub: string;
  role: "USER" | "ADMIN";
  sessionId: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
}

const accessOptions = {
  expiresIn: env.JWT_ACCESS_TTL,
} as SignOptions;

const refreshOptions = {
  expiresIn: env.JWT_REFRESH_TTL,
} as SignOptions;

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, accessOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as AccessTokenPayload;
  } catch {
    throw new AppError("UNAUTHORIZED", "Invalid or expired access token");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET, {
      algorithms: ["HS256"],
    }) as RefreshTokenPayload;
  } catch {
    throw new AppError("UNAUTHORIZED", "Invalid or expired refresh token");
  }
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}
