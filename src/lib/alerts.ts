import { logger } from "./logger.js";
import { sendEmail } from "./mailer.js";
import { env } from "./env.js";

/**
 * Send an admin alert via structured log + email.
 * Fire-and-forget safe (callers should .catch(() => {}) to avoid unhandled rejection).
 */
export async function sendAlert(subject: string, body: string): Promise<void> {
  logger.error({ alert: { subject, body } }, `ALERT: ${subject}`);
  await sendEmail(env.ADMIN_EMAIL, `[FantaBeach Alert] ${subject}`, body);
}
