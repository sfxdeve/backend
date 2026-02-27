import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import { tournamentIdParam } from "../validators/tournaments.validators.js";
import * as v from "../validators/lineups.validators.js";
import * as ctrl from "../controllers/lineups.controller.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  authenticate,
  validateRequest({ params: tournamentIdParam }),
  ctrl.getMyLineup,
);
router.put(
  "/",
  authenticate,
  validateRequest({ params: tournamentIdParam, body: v.saveLineupBody }),
  ctrl.saveLineup,
);

export default router;
