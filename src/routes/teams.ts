import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as teamsController from "../controllers/teams.controller.js";
import {
  setTeamBody,
  tournamentIdParam,
} from "../validators/teams.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ params: tournamentIdParam }),
  teamsController.getTeam,
);
router.put(
  "/",
  requireAuth,
  validateRequest({ params: tournamentIdParam, body: setTeamBody }),
  teamsController.setTeam,
);

export default router;
