import { Router } from "express";
import {
  authenticate,
  requireAdmin,
  optionalAuth,
} from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/tournaments.validators.js";
import * as ctrl from "../controllers/tournaments.controller.js";

const router = Router();

router.get(
  "/",
  optionalAuth,
  validateRequest({ query: v.tournamentListQuery }),
  ctrl.listTournaments,
);

router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ body: v.createTournamentBody }),
  ctrl.createTournament,
);

router.get(
  "/:tournamentId",
  optionalAuth,
  validateRequest({ params: v.tournamentIdParam }),
  ctrl.getTournament,
);

router.patch(
  "/:tournamentId",
  authenticate,
  requireAdmin,
  validateRequest({
    params: v.tournamentIdParam,
    body: v.updateTournamentBody,
  }),
  ctrl.updateTournament,
);

router.post(
  "/:tournamentId/register",
  authenticate,
  validateRequest({ params: v.tournamentIdParam }),
  ctrl.registerUser,
);

router.get(
  "/:tournamentId/leaderboard",
  optionalAuth,
  validateRequest({ params: v.tournamentIdParam }),
  ctrl.getLeaderboard,
);

router.get(
  "/:tournamentId/entries",
  optionalAuth,
  validateRequest({ params: v.tournamentIdParam }),
  ctrl.getEntries,
);

router.get(
  "/:tournamentId/player-statuses",
  optionalAuth,
  validateRequest({ params: v.tournamentIdParam }),
  ctrl.getPlayerStatuses,
);

router.post(
  "/:tournamentId/invite/:userId",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.tournamentInviteParams }),
  ctrl.inviteUser,
);

router.post(
  "/:tournamentId/entries",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.tournamentIdParam, body: v.bulkEntriesBody }),
  ctrl.bulkUpsertEntries,
);

export default router;
