import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as scoringController from "../controllers/scoring.controller.js";
import { playerScoresQuery, leagueIdParam } from "../validators/scoring.js";

const router = Router();

router.get(
  "/players",
  requireAuth,
  validateRequest({ query: playerScoresQuery }),
  scoringController.getPlayerScores,
);
router.get(
  "/standings/:leagueId",
  requireAuth,
  validateRequest({ params: leagueIdParam }),
  scoringController.getStandings,
);

export default router;
