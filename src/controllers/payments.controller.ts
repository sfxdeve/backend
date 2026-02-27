import type { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors.js";
import type { CreateIntentBody } from "../validators/payments.validators.js";
import * as paymentsService from "../services/payments.service.js";

export async function getPacks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const packs = await paymentsService.listPacks();
    res.json(packs);
  } catch (err) {
    next(err);
  }
}

export async function createIntent(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.auth!.userId;
    const { packId } = req.body as CreateIntentBody;
    const result = await paymentsService.createPaymentIntent(packId, userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function stripeWebhook(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawBody = req.body as Buffer;
    const signature = req.headers["stripe-signature"];
    if (!rawBody || !signature || typeof signature !== "string") {
      return next(new AppError("BAD_REQUEST", "Missing body or signature"));
    }
    await paymentsService.handleStripeWebhook(rawBody, signature);
    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}
