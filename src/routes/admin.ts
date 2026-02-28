import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAdmin } from "../middlewares/auth.js";
import * as adminController from "../controllers/admin.controller.js";
import {
  adminLogsQuery,
  priceParamsBody,
} from "../validators/admin.js";

const router = Router();

router.get(
  "/logs",
  requireAdmin,
  validateRequest({ query: adminLogsQuery }),
  adminController.getLogs,
);

router.put(
  "/price-parameters",
  requireAdmin,
  validateRequest({ body: priceParamsBody }),
  adminController.updatePriceParameters,
);

export default router;
