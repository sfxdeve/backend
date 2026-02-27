import Stripe from "stripe";
import { env } from "../lib/env.js";
import { CreditPack } from "../models/CreditPack.js";
import { ProcessedPayment } from "../models/ProcessedPayment.js";
import { AppError } from "../lib/errors.js";
import { withMongoTransaction } from "../lib/tx.js";
import { creditFromPurchase } from "./wallet.service.js";

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
}

export async function listPacks() {
  const packs = await CreditPack.find({ active: true }).lean();
  return packs;
}

export async function createPaymentIntent(packId: string, userId: string) {
  const pack = await CreditPack.findById(packId).lean();
  if (!pack || !pack.active)
    throw new AppError("NOT_FOUND", "Credit pack not found");

  const stripe = getStripe();
  let amount: number;
  let currency = "eur";

  try {
    const price = await stripe.prices.retrieve(pack.stripePriceId);
    amount = price.unit_amount ?? 0;
    currency = (price.currency as "eur") || "eur";
  } catch {
    throw new AppError("UNPROCESSABLE", "Invalid Stripe price configuration");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    metadata: { userId, packId: String(pack._id) },
    automatic_payment_methods: { enabled: true },
  });

  return {
    clientSecret: paymentIntent.client_secret,
    successUrl: env.PAYMENT_SUCCESS_URL,
    cancelUrl: env.PAYMENT_CANCEL_URL,
  };
}

export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const stripe = getStripe();
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

  if (event.type !== "payment_intent.succeeded") {
    return;
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const paymentIntentId = paymentIntent.id;
  const userId = paymentIntent.metadata?.userId;
  const packId = paymentIntent.metadata?.packId;

  if (!userId || !packId) {
    throw new AppError("UNPROCESSABLE", "Missing metadata on payment intent");
  }

  await withMongoTransaction(async (session) => {
    const existing = await ProcessedPayment.findOne(
      { stripePaymentIntentId: paymentIntentId },
      null,
      { session },
    ).lean();
    if (existing) return;

    const pack = await CreditPack.findById(packId).session(session).lean();
    if (!pack) throw new AppError("NOT_FOUND", "Credit pack not found");

    await ProcessedPayment.create(
      [{ stripePaymentIntentId: paymentIntentId }],
      { session },
    );
    await creditFromPurchase(userId, pack.credits, paymentIntentId, session);
  });
}
