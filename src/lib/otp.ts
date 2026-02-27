import crypto from "node:crypto";
import { OTP } from "../models/OTP.js";
import { hashSecret, compareSecret } from "./hash.js";
import type { OtpPurpose } from "../models/enums.js";

export function generateOtpCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createOtp(
  userId: string,
  purpose: OtpPurpose,
): Promise<string> {
  const code = generateOtpCode();
  const hash = await hashSecret(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await OTP.deleteMany({ userId, purpose });
  await OTP.create({ userId, purpose, hash, expiresAt });

  return code;
}

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  code: string,
): Promise<boolean> {
  const record = await OTP.findOne({
    userId,
    purpose,
    expiresAt: { $gt: new Date() },
  });
  if (!record) return false;

  const valid = await compareSecret(code, record.hash);
  if (valid) await record.deleteOne();

  return valid;
}
