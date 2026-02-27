import { Router } from "express";
import { authenticate } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import { tournamentIdParam } from "../validators/tournaments.validators.js";
import * as ctrl from "../controllers/scoring.controller.js";

const router = Router();

router.get(
  "/:tournamentId/me",
  authenticate,
  validateRequest({ params: tournamentIdParam }),
  ctrl.getMyScore,
);

router.get(
  "/:tournamentId/players",
  authenticate,
  validateRequest({ params: tournamentIdParam }),
  ctrl.getTournamentPlayerScores,
);

export default router;
