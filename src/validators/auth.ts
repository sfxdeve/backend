import { z } from "zod";

export const registerBody = z.object({
  email: z.email(),
  name: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const sixDigitCode = z
  .string()
  .regex(/^\d{6}$/, "Code must be exactly 6 digits");

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
