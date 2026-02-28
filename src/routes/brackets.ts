import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as bracketsController from "../controllers/brackets.controller.js";
import { tournamentIdQuery } from "../validators/brackets.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: tournamentIdQuery }),
  bracketsController.getForTournament,
);

export default router;
