import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/players.validators.js";
import * as ctrl from "../controllers/players.controller.js";

const router = Router();

router.get(
  "/",
  authenticate,
  validateRequest({ query: v.playerListQuery }),
  ctrl.listPlayers,
);
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ body: v.createPlayerBody }),
  ctrl.createPlayer,
);
router.patch(
  "/:playerId",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.playerIdParam, body: v.updatePlayerBody }),
  ctrl.updatePlayer,
);
router.get(
  "/:playerId/stats",
  authenticate,
  validateRequest({ params: v.playerIdParam }),
  ctrl.getPlayerStats,
);

export default router;
