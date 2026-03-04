import { env } from "./env.js";

const DURATION_REGEX = /^(\d+)([smhd])$/i;

function parseDurationToMs(value: string): number {
  const trimmed = value.trim();
  const match = DURATION_REGEX.exec(trimmed);

  if (!match) {
    throw new Error(
      `Invalid duration format: "${value}". Use forms like 30d, 15m, 1h, 45s.`,
    );
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`Invalid duration amount: "${value}"`);
  }

  switch (unit) {
    case "s":
      return amount * 1000;
    case "m":
      return amount * 60 * 1000;
    case "h":
      return amount * 60 * 60 * 1000;
    case "d":
      return amount * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: "${value}"`);
  }
}

export const refreshTokenCookieName = "refreshToken";

export const refreshTokenTtlMs = parseDurationToMs(env.JWT_REFRESH_TTL);

const isProd = env.NODE_ENV === "production";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  maxAge: refreshTokenTtlMs,
};

export const refreshCookieClearOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
};
