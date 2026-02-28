declare module "express-serve-static-core" {
  interface Request {
    traceId?: string;
    auth?: { sessionId: string; userId: string; role: "USER" | "ADMIN" };
  }
}
