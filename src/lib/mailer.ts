import nodemailer from "nodemailer";
import { env } from "./env.js";
import { logger } from "./logger.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

function sendEmail(email: string, subject: string, text: string): void {
  transporter
    .sendMail({ from: env.SMTP_FROM, to: email, subject, text })
    .catch((err) => logger.error({ err, email, subject }, "email send failed"));
}

export function sendVerificationOtp(email: string, otp: string): void {
  sendEmail(
    email,
    "FantaBeach verification code",
    `Your verification code is ${otp}. It expires in 10 minutes.`,
  );
}

export function sendResetPasswordOtp(email: string, code: string): void {
  sendEmail(
    email,
    "Reset your FantaBeach password",
    `Your password reset code is: ${code}\n\nThis code expires in 10 minutes.`,
  );
}
