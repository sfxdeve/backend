import { User } from "../models/User.js";
import { hashSecret, compareSecret } from "../lib/hash.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import {
  createSession,
  revokeSession,
  revokeAllUserSessions,
  validateSession,
} from "../lib/session.js";
import { createOtp, verifyOtp } from "../lib/otp.js";
import { sendVerificationOtp, sendEmail } from "../lib/mailer.js";
import { AppError } from "../lib/errors.js";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export async function register(input: RegisterInput): Promise<void> {
  const { email, password, name } = input;
  const existing = await User.findOne({ email }).lean();
  if (existing) throw new AppError("CONFLICT", "Email already in use");

  const passwordHash = await hashSecret(password);
  const user = await User.create({
    email,
    passwordHash,
    name,
    isVerified: false,
  });

  const code = await createOtp(String(user._id), "VERIFY_EMAIL");
  await sendVerificationOtp(email, code);
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}

export async function verifyEmail(input: VerifyEmailInput): Promise<void> {
  const { email, otp } = input;
  const user = await User.findOne({ email });
  if (!user) throw new AppError("BAD_REQUEST", "Invalid or expired code");

  const valid = await verifyOtp(String(user._id), "VERIFY_EMAIL", otp);
  if (!valid) throw new AppError("BAD_REQUEST", "Invalid or expired code");

  await User.updateOne({ _id: user._id }, { isVerified: true });
}

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: unknown;
    email: string;
    name: string;
    role: string;
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const { email, password, userAgent } = input;
  const user = await User.findOne({ email }).lean();
  if (!user || !user.isVerified || !user.passwordHash) {
    throw new AppError("UNAUTHORIZED", "Invalid credentials");
  }
  if (user.isBlocked) {
    throw new AppError("FORBIDDEN", "Account is blocked");
  }

  const match = await compareSecret(password, user.passwordHash);
  if (!match) throw new AppError("UNAUTHORIZED", "Invalid credentials");

  const sessionId = await createSession(String(user._id), userAgent);

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as "USER" | "ADMIN",
    sessionId,
  });
  const refreshToken = signRefreshToken({
    sub: String(user._id),
    sessionId,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      email: user.email ?? "",
      name: user.name ?? "",
      role: user.role ?? "USER",
    },
  };
}

export interface RefreshInput {
  refreshToken: string;
}

export interface RefreshResult {
  accessToken: string;
}

export async function refresh(input: RefreshInput): Promise<RefreshResult> {
  const { refreshToken } = input;
  const payload = verifyRefreshToken(refreshToken);

  const sessionActive = await validateSession(payload.sessionId);
  if (!sessionActive) {
    throw new AppError("UNAUTHORIZED", "Session expired or revoked");
  }

  const user = await User.findById(payload.sub).lean();
  if (!user) throw new AppError("UNAUTHORIZED", "Session expired or revoked");
  if (user.isBlocked) {
    throw new AppError("FORBIDDEN", "Account is blocked");
  }

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as "USER" | "ADMIN",
    sessionId: payload.sessionId,
  });

  return { accessToken };
}

export async function logout(sessionId: string): Promise<void> {
  await revokeSession(sessionId);
}

export interface RequestPasswordResetInput {
  email: string;
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput,
): Promise<void> {
  const { email } = input;
  const user = await User.findOne({ email }).lean();

  if (user && user.isVerified) {
    const code = await createOtp(String(user._id), "RESET_PASSWORD");
    await sendEmail(
      email,
      "FantaBeach — Password Reset Code",
      `Your password reset code is: ${code}\n\nThis code expires in 10 minutes.`,
    );
  }
}

export interface ResetPasswordInput {
  email: string;
  otp: string;
  newPassword: string;
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const { email, otp, newPassword } = input;
  const user = await User.findOne({ email });
  if (!user) throw new AppError("BAD_REQUEST", "Invalid or expired code");

  const valid = await verifyOtp(String(user._id), "RESET_PASSWORD", otp);
  if (!valid) throw new AppError("BAD_REQUEST", "Invalid or expired code");

  const passwordHash = await hashSecret(newPassword);
  await User.updateOne({ _id: user._id }, { passwordHash });
  await revokeAllUserSessions(String(user._id));
}
