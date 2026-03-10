import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAdmin } from "../../middlewares/auth.js";
import * as service from "./service.js";
import { AuditLogsQuerySchema, type AuditLogsQueryType } from "./schema.js";

const router = Router();

async function handleList(req: Request, res: Response) {
  const result = await service.list(req.validated!.query as AuditLogsQueryType);

  res.status(200).json(result);
}

router.get(
  "/audit-logs",
  requireAdmin,
  validateRequest({ query: AuditLogsQuerySchema }),
  handleList,
);

router.get(
  "/",
  requireAdmin,
  validateRequest({ query: AuditLogsQuerySchema }),
  handleList,
);

export default router;
