import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as leaguesController from "../controllers/leagues.controller.js";
import {
  createLeagueBody,
  joinLeagueBody,
  updateLeagueBody,
  leagueIdParam,
  listLeaguesQuery,
} from "../validators/leagues.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: listLeaguesQuery }),
  leaguesController.list,
);
router.get(
  "/:id",
  requireAuth,
  validateRequest({ params: leagueIdParam }),
  leaguesController.getById,
);
router.get(
  "/:id/standings",
  requireAuth,
  validateRequest({ params: leagueIdParam }),
  leaguesController.getStandings,
);
router.post(
  "/",
  requireAuth,
  validateRequest({ body: createLeagueBody }),
  leaguesController.create,
);
router.post(
  "/:id/join",
  requireAuth,
  validateRequest({ params: leagueIdParam, body: joinLeagueBody }),
  leaguesController.join,
);
router.put(
  "/:id",
  requireAuth,
  validateRequest({ params: leagueIdParam, body: updateLeagueBody }),
  leaguesController.update,
);

export default router;
