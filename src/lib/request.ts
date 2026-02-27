import type { Request } from "express";

/** Get a route param as a string (handles Express's string | string[]). */
export function getParam(req: Request, key: string): string {
  const value = req.params[key];
  return String(Array.isArray(value) ? value[0] : value);
}

/** Access context for tournament visibility (public vs private + registered/invited). */
export function getAccessContext(req: Request): {
  userId?: string;
  isAdmin: boolean;
} {
  return {
    userId: req.auth?.userId,
    isAdmin: req.auth?.role === "ADMIN",
  };
}
