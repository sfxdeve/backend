import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as poolsController from "../controllers/pools.controller.js";
import {
  createGroupBody,
  tournamentIdQuery,
  groupIdParam,
  assignPairBody,
} from "../validators/pools.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: tournamentIdQuery }),
  poolsController.list,
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createGroupBody, query: tournamentIdQuery }),
  poolsController.createGroup,
);
router.post(
  "/:groupId/pairs",
  requireAdmin,
  validateRequest({ params: groupIdParam, body: assignPairBody }),
  poolsController.assignPair,
);

export default router;
