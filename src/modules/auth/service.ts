import { User } from "../../models/Auth.js";
import { Wallet } from "../../models/Credits.js";
import { OtpPurpose } from "../../models/enums.js";
import { AppError } from "../../lib/errors.js";
import { hashSecret, compareSecret } from "../../lib/hash.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt.js";
import {
  createSession,
  revokeSession,
  revokeAllUserSessions,
  validateSession,
} from "../../lib/session.js";
import { createOtp, verifyOtp } from "../../lib/otp.js";
import { sendEmail } from "../../lib/mailer.js";
import { withMongoTransaction } from "../../lib/tx.js";
import type {
  RegisterBodyType,
  LoginBodyType,
  VerifyEmailBodyType,
  ForgotPasswordBodyType,
  ResetPasswordBodyType,
} from "./schema.js";

export async function register(body: RegisterBodyType) {
  const existing = await User.findOne({ email: body.email }).lean();
  if (existing) {
    throw new AppError("CONFLICT", "Email already registered");
  }

  const passwordHash = await hashSecret(body.password);

  // Create user and wallet atomically — orphaned User without Wallet must not happen
  const user = await withMongoTransaction(async (session) => {
    const [created] = await User.create(
      [{ name: body.name, email: body.email, passwordHash }],
      { session },
    );
    await Wallet.create([{ userId: created._id }], { session });
    return created;
  });

  // Send verification OTP
  const code = await createOtp(String(user._id), OtpPurpose.VERIFY_EMAIL);
  await sendEmail(
    user.email,
    "Verify your FantaBeach account",
    `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
  );

  return { message: "Registration successful. Check your email for a verification code." };
}

export async function verifyEmail(body: VerifyEmailBodyType) {
  const user = await User.findOne({ email: body.email });
  if (!user) throw new AppError("NOT_FOUND", "User not found");
  if (user.isVerified) throw new AppError("CONFLICT", "Email already verified");

  const valid = await verifyOtp(String(user._id), OtpPurpose.VERIFY_EMAIL, body.code);
  if (!valid) throw new AppError("BAD_REQUEST", "Invalid or expired code");

  user.isVerified = true;
  await user.save();

  return { message: "Email verified successfully" };
}

export async function login(body: LoginBodyType, userAgent?: string) {
  const user = await User.findOne({ email: body.email });
  if (!user) throw new AppError("UNAUTHORIZED", "Invalid credentials");

  const match = await compareSecret(body.password, user.passwordHash);
  if (!match) throw new AppError("UNAUTHORIZED", "Invalid credentials");

  if (!user.isVerified) {
    throw new AppError("FORBIDDEN", "Please verify your email before logging in");
  }
  if (user.isBlocked) {
    throw new AppError("FORBIDDEN", "Your account has been suspended");
  }

  const sessionId = await createSession(String(user._id), userAgent);
  const payload = { sub: String(user._id), role: user.role, sessionId };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: String(user._id), sessionId });

  return { accessToken, refreshToken, user: { id: String(user._id), name: user.name, email: user.email, role: user.role } };
}

export async function refreshTokens(token: string, userAgent?: string) {
  const payload = verifyRefreshToken(token);

  const valid = await validateSession(payload.sessionId);
  if (!valid) throw new AppError("UNAUTHORIZED", "Session invalid or expired");

  const user = await User.findById(payload.sub).lean();
  if (!user || user.isBlocked) {
    throw new AppError("UNAUTHORIZED", "User not found or blocked");
  }

  // Rotate: revoke old session, create new
  await revokeSession(payload.sessionId);
  const newSessionId = await createSession(String(user._id), userAgent);
  const newPayload = { sub: String(user._id), role: user.role, sessionId: newSessionId };

  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken({ sub: String(user._id), sessionId: newSessionId });

  return { accessToken, refreshToken };
}

export async function logout(sessionId: string) {
  await revokeSession(sessionId);
  return { message: "Logged out successfully" };
}

export async function forgotPassword(body: ForgotPasswordBodyType) {
  const user = await User.findOne({ email: body.email }).lean();
  // Always return success to avoid email enumeration
  if (!user) return { message: "If that email exists, a reset code has been sent" };

  const code = await createOtp(String(user._id), OtpPurpose.RESET_PASSWORD);
  await sendEmail(
    user.email,
    "Reset your FantaBeach password",
    `Your password reset code is: ${code}\n\nThis code expires in 10 minutes.`,
  );

  return { message: "If that email exists, a reset code has been sent" };
}

export async function resetPassword(body: ResetPasswordBodyType) {
  const user = await User.findOne({ email: body.email });
  if (!user) throw new AppError("NOT_FOUND", "User not found");

  const valid = await verifyOtp(String(user._id), OtpPurpose.RESET_PASSWORD, body.code);
  if (!valid) throw new AppError("BAD_REQUEST", "Invalid or expired code");

  user.passwordHash = await hashSecret(body.password);
  await user.save();

  await revokeAllUserSessions(String(user._id));

  return { message: "Password reset successfully. Please log in again." };
}
