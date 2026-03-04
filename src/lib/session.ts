import { Session } from "../models/Auth.js";
import { refreshTokenTtlMs } from "./auth-config.js";

export async function createSession(
  userId: string,
  userAgent?: string,
): Promise<string> {
  const expiresAt = new Date(Date.now() + refreshTokenTtlMs);
  const session = await Session.create({ userId, userAgent, expiresAt });

  return String(session._id);
}

export async function revokeSession(sessionId: string): Promise<void> {
  await Session.updateOne({ _id: sessionId }, { isRevoked: true });
}

export async function revokeSessionIfActive(
  sessionId: string,
  userId: string,
): Promise<boolean> {
  const now = new Date();
  const result = await Session.updateOne(
    {
      _id: sessionId,
      userId,
      isRevoked: false,
      expiresAt: { $gt: now },
    },
    { isRevoked: true },
  );

  return result.modifiedCount === 1;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await Session.updateMany({ userId }, { isRevoked: true });
}

export async function validateSession(
  sessionId: string,
  userId?: string,
): Promise<boolean> {
  const now = new Date();
  const query: {
    _id: string;
    userId?: string;
    isRevoked: boolean;
    expiresAt: { $gt: Date };
  } = {
    _id: sessionId,
    isRevoked: false,
    expiresAt: { $gt: now },
  };

  if (userId) {
    query.userId = userId;
  }

  const session = await Session.findOne(query).lean();

  return session != null;
}
