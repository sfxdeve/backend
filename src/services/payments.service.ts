import Stripe from "stripe";
import { CreditPack } from "../models/CreditPack.js";
import { ProcessedPayment } from "../models/ProcessedPayment.js";
import { AppError } from "../lib/errors.js";
import { env } from "../lib/env.js";
import * as walletService from "./wallet.service.js";
import {
  CreditTransactionType,
  CreditTransactionSource,
} from "../models/enums.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function listPacks() {
  return CreditPack.find({ active: true }).lean();
}

export async function createCheckoutSession(
  userId: string,
  packId: string,
): Promise<{ url: string; sessionId: string }> {
  const pack = await CreditPack.findById(packId).lean();
  if (!pack || !pack.active)
    throw new AppError("NOT_FOUND", "Credit pack not found");
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: pack.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: env.PAYMENT_SUCCESS_URL,
    cancel_url: env.PAYMENT_CANCEL_URL,
    client_reference_id: userId,
    metadata: { packId: pack._id.toString(), credits: String(pack.credits) },
  });
  if (!session.url)
    throw new AppError(
      "INTERNAL_SERVER_ERROR",
      "Failed to create checkout session",
    );
  return { url: session.url, sessionId: session.id };
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string,
): Promise<void> {
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    throw new AppError("BAD_REQUEST", "Invalid webhook signature");
  }
  const existing = await ProcessedPayment.findOne({
    stripeEventId: event.id,
  }).lean();
  if (existing) return;
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const packId = session.metadata?.packId;
    const credits = session.metadata?.credits
      ? parseInt(session.metadata.credits, 10)
      : 0;
    if (!userId || !packId || credits <= 0)
      throw new AppError("BAD_REQUEST", "Invalid session metadata");
    await ProcessedPayment.create({ stripeEventId: event.id });
    await walletService.credit(
      userId,
      credits,
      CreditTransactionType.PURCHASE,
      CreditTransactionSource.STRIPE,
      { stripeSessionId: session.id, packId },
    );
  }
}
