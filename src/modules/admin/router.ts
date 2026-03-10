import { Router, type Request, type Response } from "express";
import { requireAdmin } from "../../middlewares/auth.js";
import { validateRequest } from "../../middlewares/validate-request.js";
import { LeagueQuerySchema, type LeagueQueryType } from "../leagues/schema.js";
import { WalletQuerySchema, type WalletQueryType } from "../credits/schema.js";
import * as leagueService from "../leagues/service.js";
import * as creditService from "../credits/service.js";

const router = Router();

router.get(
  "/leagues",
  requireAdmin,
  validateRequest({ query: LeagueQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await leagueService.listAdmin(
      req.validated!.query as LeagueQueryType,
    );

    res.status(200).json(result);
  },
);

router.get(
  "/transactions",
  requireAdmin,
  validateRequest({ query: WalletQuerySchema }),
  async (req: Request, res: Response) => {
    const result = await creditService.listTransactions(
      req.validated!.query as WalletQueryType,
    );

    res.status(200).json(result);
  },
);

export default router;
