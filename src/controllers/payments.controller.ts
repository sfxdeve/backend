import type { Request, Response, NextFunction } from "express";
import * as paymentsService from "../services/payments.service.js";

export async function stripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const signature = req.headers["stripe-signature"] as string;
    if (!signature) {
      res.status(400).send("Missing stripe-signature");
      return;
    }
    const rawBody = req.body as Buffer;
    await paymentsService.handleStripeWebhook(rawBody, signature);
    res.status(200).send();
  } catch (e) {
    next(e);
  }
}

export async function createCheckout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const { packId } = req.body;
    const result = await paymentsService.createCheckoutSession(userId, packId);
    res.json(result);
  } catch (e) {
    next(e);
  }
}

export async function listPacks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await paymentsService.listPacks();
    res.json(result);
  } catch (e) {
    next(e);
  }
}
