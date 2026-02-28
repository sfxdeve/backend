import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as bracketsController from "../controllers/brackets.controller.js";
import * as scoringController from "../controllers/scoring.controller.js";
import * as tournamentsController from "../controllers/tournaments.controller.js";
import {
  createTournamentBody,
  listTournamentsQuery,
  tournamentIdParam,
  updateTournamentBody,
} from "../validators/tournaments.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: listTournamentsQuery }),
  tournamentsController.list,
);
router.get("/live", requireAuth, tournamentsController.listLive);
router.get(
  "/:id",
  requireAuth,
  validateRequest({ params: tournamentIdParam }),
  tournamentsController.getById,
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createTournamentBody }),
  tournamentsController.create,
);
router.put(
  "/:id",
  requireAdmin,
  validateRequest({ params: tournamentIdParam, body: updateTournamentBody }),
  tournamentsController.update,
);
router.post(
  "/:id/finalize",
  requireAdmin,
  validateRequest({ params: tournamentIdParam }),
  tournamentsController.finalize,
);
router.post(
  "/:id/force-lock",
  requireAdmin,
  validateRequest({ params: tournamentIdParam }),
  tournamentsController.forceLock,
);
router.post(
  "/:id/recompute",
  requireAdmin,
  validateRequest({ params: tournamentIdParam }),
  scoringController.triggerRecompute,
);
router.post(
  "/:id/bracket/generate",
  requireAdmin,
  validateRequest({ params: tournamentIdParam }),
  bracketsController.generateBracket,
);

export default router;
