import { Router } from "express";
import { validateRequest } from "../middlewares/validate-request.js";
import { requireAuth } from "../middlewares/auth.js";
import * as walletController from "../controllers/wallet.controller.js";
import { listTransactionsQuery } from "../validators/wallet.js";

const router = Router();

router.get("/", requireAuth, walletController.getWallet);
router.get(
  "/transactions",
  requireAuth,
  validateRequest({ query: listTransactionsQuery }),
  walletController.getTransactions,
);

export default router;
