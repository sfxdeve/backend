import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/auth.js";
import { validateRequest } from "../middlewares/validate-request.js";
import * as v from "../validators/seasons.validators.js";
import * as ctrl from "../controllers/seasons.controller.js";

const router = Router();

router.get("/", ctrl.listSeasons);
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateRequest({ body: v.createSeasonBody }),
  ctrl.createSeason,
);
router.patch(
  "/:seasonId",
  authenticate,
  requireAdmin,
  validateRequest({ params: v.seasonIdParam, body: v.updateSeasonBody }),
  ctrl.updateSeason,
);

export default router;
