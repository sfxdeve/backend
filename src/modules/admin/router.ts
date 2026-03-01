import { Router, type Request, type Response } from "express";
import { validateRequest } from "../../middlewares/validate-request.js";
import { requireAdmin } from "../../middlewares/auth.js";
import * as service from "./service.js";
import { AuditLogQueryParams, type AuditLogQueryParamsType } from "./schema.js";

const router = Router();

router.get(
  "/audit-log",
  requireAdmin,
  validateRequest({ query: AuditLogQueryParams }),
  async (req: Request, res: Response) => {
    const data = await service.getAuditLog(req.query as unknown as AuditLogQueryParamsType);
    res.json({ success: true, ...data });
  },
);

export default router;
