import type { Request, Response, NextFunction } from "express";
import * as walletService from "../services/wallet.service.js";

export async function getWallet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const result = await walletService.getWallet(userId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function getTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const result = await walletService.getTransactions(
      userId,
      req.query as never,
    );
    res.json(result);
  } catch (e) {
    next(e);
  }
}
