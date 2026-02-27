import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/payments.validators.js";
import * as ctrl from "../controllers/payments.controller.js";

const router = Router();

router.get("/packs", ctrl.getPacks);

router.post(
  "/create-intent",
  authenticate,
  validateRequest({ body: v.createIntentBody }),
  ctrl.createIntent,
);

export default router;
