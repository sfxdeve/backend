import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as pairsController from "../controllers/pairs.controller.js";
import {
  createPairBody,
  pairIdParam,
  tournamentIdQuery,
} from "../validators/pairs.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: tournamentIdQuery }),
  pairsController.list,
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createPairBody, query: tournamentIdQuery }),
  pairsController.create,
);
router.delete(
  "/:id",
  requireAdmin,
  validateRequest({ params: pairIdParam }),
  pairsController.deletePair,
);

export default router;
