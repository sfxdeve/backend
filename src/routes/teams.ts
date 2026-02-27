import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import { tournamentIdParam } from "../validators/tournaments.validators.js";
import * as v from "../validators/teams.validators.js";
import * as ctrl from "../controllers/teams.controller.js";

const router = Router({ mergeParams: true });

router.get(
  "/",
  authenticate,
  validateRequest({ params: tournamentIdParam }),
  ctrl.getMyTeam,
);
router.put(
  "/",
  authenticate,
  validateRequest({ params: tournamentIdParam, body: v.saveTeamBody }),
  ctrl.saveTeam,
);

export default router;
