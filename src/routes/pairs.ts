import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/pairs.validators.js";
import * as ctrl from "../controllers/pairs.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  validateRequest({ query: v.pairListQuery }),
  ctrl.listPairs,
);
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ body: v.createPairBody }),
  ctrl.createPair,
);
router.delete(
  "/:pairId",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.pairIdParam }),
  ctrl.deletePair,
);

export default router;
