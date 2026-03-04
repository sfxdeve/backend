import { z } from "zod";

const Email = z.string().trim().toLowerCase().email();
const OtpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Code must be 6 digits");

export const RegisterBody = z.object({
  name: z.string().trim().min(2).max(100),
  email: Email,
  password: z.string().min(8).max(128),
});

export const VerifyEmailBody = z.object({
  email: Email,
  code: OtpCode,
});

export const LoginBody = z.object({
  email: Email,
  password: z.string().min(1),
});

export const ForgotPasswordBody = z.object({
  email: Email,
});

export const ResetPasswordBody = z.object({
  email: Email,
  code: OtpCode,
  password: z.string().min(8).max(128),
});

export type RegisterBodyType = z.infer<typeof RegisterBody>;

export type VerifyEmailBodyType = z.infer<typeof VerifyEmailBody>;

export type LoginBodyType = z.infer<typeof LoginBody>;

export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBody>;

export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBody>;
