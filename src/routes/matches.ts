import { Router } from "express";
import {
  authenticate,
  optionalAuth,
  requireAdmin,
} from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/matches.validators.js";
import * as ctrl from "../controllers/matches.controller.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  validateRequest({ query: v.matchListQuery }),
  ctrl.listMatches,
);
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ body: v.createMatchBody }),
  ctrl.createMatch,
);
router.patch(
  "/:matchId",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.matchIdParam, body: v.updateMatchBody }),
  ctrl.updateMatch,
);
router.post(
  "/:matchId/result",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.matchIdParam, body: v.submitResultBody }),
  ctrl.submitResult,
);

export default router;
