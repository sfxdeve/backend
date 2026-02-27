import { Router } from "express";
import { authenticate, optionalAuth } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/leagues.validators.js";
import * as ctrl from "../controllers/leagues.controller.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  validateRequest({ query: v.leagueListQuery }),
  ctrl.listLeagues,
);

router.post(
  "/",
  authenticate,
  validateRequest({ body: v.createLeagueBody }),
  ctrl.createLeague,
);

router.post(
  "/join-by-code",
  authenticate,
  validateRequest({ body: v.joinByCodeBody }),
  ctrl.joinByCode,
);

router.get(
  "/:leagueId",
  optionalAuth,
  validateRequest({ params: v.leagueIdParam }),
  ctrl.getLeague,
);

router.post(
  "/:leagueId/join",
  authenticate,
  validateRequest({ params: v.leagueIdParam }),
  ctrl.joinLeague,
);

router.get(
  "/:leagueId/leaderboard",
  optionalAuth,
  validateRequest({ params: v.leagueIdParam }),
  ctrl.getLeagueLeaderboard,
);

export default router;
