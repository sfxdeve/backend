import { Router } from "express";
import { optionalAuth } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/brackets.validators.js";
import * as ctrl from "../controllers/brackets.controller.js";

const router = Router();

// GET /api/brackets?tournamentId=<id> — full bracket: qualification, pools, main draw
router.get(
  "/",
  optionalAuth,
  validateRequest({ query: v.bracketListQuery }),
  ctrl.getBracket,
);

export default router;
