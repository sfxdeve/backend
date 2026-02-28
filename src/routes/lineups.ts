import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as lineupsController from "../controllers/lineups.controller.js";
import { setLineupBody, tournamentIdParam } from "../validators/lineups.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ params: tournamentIdParam }),
  lineupsController.getLineup,
);
router.put(
  "/",
  requireAuth,
  validateRequest({ params: tournamentIdParam, body: setLineupBody }),
  lineupsController.setLineup,
);
router.post(
  "/lock",
  requireAuth,
  validateRequest({ params: tournamentIdParam }),
  lineupsController.lockLineup,
);

export default router;
