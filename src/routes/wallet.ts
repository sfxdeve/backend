import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/wallet.validators.js";
import * as ctrl from "../controllers/wallet.controller.js";

const router = Router();

router.get("/", authenticate, ctrl.getWallet);

router.post(
  "/spend",
  authenticate,
  validateRequest({ body: v.spendBody }),
  ctrl.spend,
);

router.post(
  "/:userId/adjust",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.walletUserIdParam, body: v.adjustBody }),
  ctrl.adjust,
);

export default router;
