import type { Request } from "express";

export function param(req: Request, name: string): string {
  const p = req.params[name];
  if (typeof p === "string") return p;
  if (Array.isArray(p)) return p[0] ?? "";
  return "";
}
