import { z } from "zod";

export const RegisterBody = z.object({
  name: z.string().min(2).max(100),
  email: z.email(),
  password: z.string().min(8).max(128),
});

export const VerifyEmailBody = z.object({
  email: z.email(),
  code: z.string().length(6),
});

export const LoginBody = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const ForgotPasswordBody = z.object({
  email: z.email(),
});

export const ResetPasswordBody = z.object({
  email: z.email(),
  code: z.string().length(6),
  password: z.string().min(8).max(128),
});

export type RegisterBodyType = z.infer<typeof RegisterBody>;
export type VerifyEmailBodyType = z.infer<typeof VerifyEmailBody>;
export type LoginBodyType = z.infer<typeof LoginBody>;
export type ForgotPasswordBodyType = z.infer<typeof ForgotPasswordBody>;
export type ResetPasswordBodyType = z.infer<typeof ResetPasswordBody>;
