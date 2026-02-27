declare module "express-serve-static-core" {
  interface Request {
    traceId?: string;
    auth?: { userId: string; role: "USER" | "ADMIN"; sessionId: string };
  }
}
