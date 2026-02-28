import { User } from "../models/User.js";
import { Wallet } from "../models/Wallet.js";
import { AppError } from "../lib/errors.js";
import { hashSecret, compareSecret } from "../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type AccessTokenPayload,
} from "../lib/jwt.js";
import {
  createSession,
  revokeSession,
  revokeAllUserSessions,
  validateSession,
} from "../lib/session.js";
import { createOtp, verifyOtp } from "../lib/otp.js";
import { sendVerificationOtp, sendEmail } from "../lib/mailer.js";
import { OtpPurpose } from "../models/enums.js";

export interface RegisterBody {
  email: string;
  name: string;
  password: string;
}

export async function register(
  body: RegisterBody,
): Promise<{ userId: string }> {
  const existing = await User.findOne({ email: body.email }).lean();
  if (existing) throw new AppError("CONFLICT", "Email already registered");
  const passwordHash = await hashSecret(body.password);
  const user = await User.create({
    email: body.email,
    name: body.name,
    passwordHash,
    role: "USER",
    isVerified: false,
    isBlocked: false,
  });
  await Wallet.create({
    userId: user._id,
    balance: 0,
    totalPurchased: 0,
    totalSpent: 0,
  });
  const code = await createOtp(user._id.toString(), OtpPurpose.VERIFY_EMAIL);
  await sendVerificationOtp(body.email, code);
  return { userId: user._id.toString() };
}

export async function verifyEmail(userId: string, code: string): Promise<void> {
  const valid = await verifyOtp(userId, OtpPurpose.VERIFY_EMAIL, code);
  if (!valid) throw new AppError("BAD_REQUEST", "Invalid or expired code");
  await User.updateOne({ _id: userId }, { $set: { isVerified: true } });
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string; name: string; role: string };
}

export async function login(
  email: string,
  password: string,
  userAgent?: string,
): Promise<LoginResult> {
  const user = await User.findOne({ email }).lean();
  if (!user) throw new AppError("UNAUTHORIZED", "Invalid credentials");
  const ok = await compareSecret(password, user.passwordHash);
  if (!ok) throw new AppError("UNAUTHORIZED", "Invalid credentials");
  if (!user.isVerified) throw new AppError("FORBIDDEN", "Email not verified");
  if (user.isBlocked) throw new AppError("FORBIDDEN", "Account blocked");
  const sessionId = await createSession(user._id.toString(), userAgent);
  const accessToken = signAccessToken({
    sub: user._id.toString(),
    role: user.role as AccessTokenPayload["role"],
    sessionId,
  });
  const refreshToken = signRefreshToken({
    sub: user._id.toString(),
    sessionId,
  });
  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<{ accessToken: string }> {
  const payload = verifyRefreshToken(refreshToken);
  const valid = await validateSession(payload.sessionId);
  if (!valid) throw new AppError("UNAUTHORIZED", "Session invalid or revoked");
  const user = await User.findById(payload.sub).lean();
  if (!user || user.isBlocked)
    throw new AppError("UNAUTHORIZED", "User not found or blocked");
  const accessToken = signAccessToken({
    sub: payload.sub,
    role: user.role as AccessTokenPayload["role"],
    sessionId: payload.sessionId,
  });
  return { accessToken };
}

export async function logout(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({ email }).lean();
  if (!user) return; // no leak
  const code = await createOtp(user._id.toString(), OtpPurpose.RESET_PASSWORD);
  await sendEmail(
    email,
    "FantaBeach password reset",
    `Your reset code is ${code}. It expires in 10 minutes.`,
  );
}

export async function resetPassword(
  userId: string,
  code: string,
  newPassword: string,
): Promise<void> {
  const valid = await verifyOtp(userId, OtpPurpose.RESET_PASSWORD, code);
  if (!valid) throw new AppError("BAD_REQUEST", "Invalid or expired code");
  const passwordHash = await hashSecret(newPassword);
  await User.updateOne({ _id: userId }, { $set: { passwordHash } });
  await revokeAllUserSessions(userId);
}
