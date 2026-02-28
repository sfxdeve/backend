import { z } from "zod";

const sixDigitCode = z
  .string()
  .regex(/^\d{6}$/, "Code must be exactly 6 digits");

export const registerBody = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const verifyEmailBody = z.object({
  userId: z.string().min(1),
  code: sixDigitCode,
});

export const forgotPasswordBody = z.object({
  email: z.email(),
});

export const resetPasswordBody = z.object({
  userId: z.string().min(1),
  code: sixDigitCode,
  newPassword: z.string().min(8),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
export type VerifyEmailBody = z.infer<typeof verifyEmailBody>;
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBody>;
export type ResetPasswordBody = z.infer<typeof resetPasswordBody>;
export type RefreshBody = z.infer<typeof refreshBody>;
