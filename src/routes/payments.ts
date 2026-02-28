import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as paymentsController from "../controllers/payments.controller.js";
import { createCheckoutBody } from "../validators/payments.js";

const router = Router();

router.get("/packs", requireAuth, paymentsController.listPacks);
router.post(
  "/checkout",
  requireAuth,
  validateRequest({ body: createCheckoutBody }),
  paymentsController.createCheckout,
);

export default router;
