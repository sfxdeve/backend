import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as matchesController from "../controllers/matches.controller.js";
import {
  createMatchBody,
  listMatchesQuery,
  matchIdParam,
  updateScoreBody,
} from "../validators/matches.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: listMatchesQuery }),
  matchesController.list,
);
router.get(
  "/:id",
  requireAuth,
  validateRequest({ params: matchIdParam }),
  matchesController.getById,
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createMatchBody }),
  matchesController.create,
);
router.put(
  "/:id/score",
  requireAdmin,
  validateRequest({ params: matchIdParam, body: updateScoreBody }),
  matchesController.updateScore,
);
router.post(
  "/:id/live",
  requireAdmin,
  validateRequest({ params: matchIdParam }),
  matchesController.setLive,
);
router.post(
  "/:id/complete",
  requireAdmin,
  validateRequest({ params: matchIdParam, body: updateScoreBody }),
  matchesController.complete,
);

export default router;
