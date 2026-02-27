import { Session } from "../models/Session.js";

export async function createSession(
  userId: string,
  userAgent?: string,
): Promise<string> {
  const session = await Session.create({ userId, userAgent });
  return String(session._id);
}

export async function revokeSession(sessionId: string): Promise<void> {
  await Session.updateOne({ _id: sessionId }, { isRevoked: true });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await Session.updateMany({ userId }, { isRevoked: true });
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const session = await Session.findById(sessionId).lean();
  return session != null && !session.isRevoked;
}
