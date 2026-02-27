import nodemailer from "nodemailer";
import { env } from "./env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendVerificationOtp(
  email: string,
  otp: string,
): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject: "FantaBeach verification code",
    text: `Your verification code is ${otp}. It expires in 10 minutes.`,
  });
}

export async function sendEmail(
  email: string,
  subject: string,
  text: string,
): Promise<void> {
  await transporter.sendMail({
    from: env.SMTP_FROM,
    to: email,
    subject,
    text,
  });
}
