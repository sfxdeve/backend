import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as playersController from "../controllers/players.controller.js";
import {
  adjustPriceBody,
  createPlayerBody,
  listPlayersQuery,
  playerIdParam,
  updatePlayerBody,
} from "../validators/players.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: listPlayersQuery }),
  playersController.list,
);
router.get(
  "/:id",
  requireAuth,
  validateRequest({ params: playerIdParam }),
  playersController.getById,
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createPlayerBody }),
  playersController.create,
);
router.put(
  "/:id",
  requireAdmin,
  validateRequest({ params: playerIdParam, body: updatePlayerBody }),
  playersController.update,
);
router.put(
  "/:id/price",
  requireAdmin,
  validateRequest({ params: playerIdParam, body: adjustPriceBody }),
  playersController.adjustPrice,
);

export default router;
