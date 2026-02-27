import { z } from "zod";

export const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(100),
});

export const verifyEmailBody = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshBody = z.object({
  refreshToken: z.string().min(1),
});

export const requestPasswordResetBody = z.object({
  email: z.string().email(),
});

export const resetPasswordBody = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8),
});
