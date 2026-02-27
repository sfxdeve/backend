import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/pools.validators.js";
import * as ctrl from "../controllers/pools.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  validateRequest({ query: v.poolListQuery }),
  ctrl.listPools,
);
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ body: v.createPoolGroupBody }),
  ctrl.createPoolGroup,
);
router.patch(
  "/:poolGroupId",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.poolGroupIdParam, body: v.updatePoolGroupBody }),
  ctrl.updatePoolGroup,
);

export default router;
