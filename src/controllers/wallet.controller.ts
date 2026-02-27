import type { Request, Response, NextFunction } from "express";
import { getParam } from "../lib/request.js";
import type { AdjustBody, SpendBody } from "../validators/wallet.validators.js";
import * as walletService from "../services/wallet.service.js";

export async function getWallet(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const result = await walletService.getWalletWithTransactions(userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function spend(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const { amount, reason } = req.body as SpendBody;
    const wallet = await walletService.spend(userId, amount, reason);
    res.json(wallet);
  } catch (err) {
    next(err);
  }
}

export async function adjust(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = getParam(req, "userId");
    const { amount, reason } = req.body as AdjustBody;
    const wallet = await walletService.adjust(userId, amount, reason);
    res.json(wallet);
  } catch (err) {
    next(err);
  }
}
