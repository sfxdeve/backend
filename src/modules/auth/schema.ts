import { z } from "zod";

export const RegisterBodySchema = z.object({
  name: z
    .string("Name must be a string")
    .min(3, "Name must be at least 3 characters")
    .max(128, "Name must be at most 128 characters"),
  email: z.email("Email must be a valid email address"),
  password: z
    .string("Password must be a string")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),
});

export const VerifyEmailBodySchema = z.object({
  email: z.email("Email must be a valid email address"),
  code: z
    .string("Code must be a string")
    .min(6, "Code must be 6 characters")
    .regex(/^\d{6}$/, "Code must be 6 characters"),
});

export const LoginBodySchema = z.object({
  email: z.email("Email must be a valid email address"),
  password: z
    .string("Password must be a string")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),
  userAgent: z.string("User agent must be a string").optional(),
});

export const RefreshTokenBodySchema = z.object({
  refreshToken: z
    .string("Refresh token must be a string")
    .min(1, "Refresh token must be at least 1 character"),
  userAgent: z.string("User agent must be a string").optional(),
});

export const LogoutBodySchema = z.object({
  sessionId: z
    .string("Session ID must be a string")
    .min(1, "Session ID must be at least 1 character"),
});

export const ForgotPasswordBodySchema = z.object({
  email: z.email("Email must be a valid email address"),
});

export const ResetPasswordBodySchema = z.object({
  email: z.email("Email must be a valid email address"),
  code: z
    .string("Code must be a string")
    .min(6, "Code must be 6 characters")
    .regex(/^\d{6}$/, "Code must be 6 characters"),
  password: z
    .string("Password must be a string")
    .min(8, "Password must be at least 8 characters")
    .max(32, "Password must be at most 32 characters"),
});

export type RegisterBodyType = z.infer<typeof RegisterBodySchema>;

export type VerifyEmailBodyType = z.infer<typeof VerifyEmailBodySchema>;

export type LoginBodyType = z.infer<typeof LoginBodySchema>;

export type RefreshTokenBodyType = z.infer<typeof RefreshTokenBodySchema>;

export type LogoutBodyType = z.infer<typeof LogoutBodySchema>;

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBodySchema>;

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBodySchema>;
