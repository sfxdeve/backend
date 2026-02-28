import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth, requireAdmin } from "../middlewares/auth.js";
import * as seasonsController from "../controllers/seasons.controller.js";
import {
  createSeasonBody,
  listSeasonsQuery,
  seasonIdParam,
  updateSeasonBody,
} from "../validators/seasons.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  validateRequest({ query: listSeasonsQuery }),
  seasonsController.list,
);
router.get(
  "/:id",
  requireAuth,
  validateRequest({ params: seasonIdParam }),
  seasonsController.getById,
);
router.post(
  "/",
  requireAdmin,
  validateRequest({ body: createSeasonBody }),
  seasonsController.create,
);
router.put(
  "/:id",
  requireAdmin,
  validateRequest({ params: seasonIdParam, body: updateSeasonBody }),
  seasonsController.update,
);

export default router;
