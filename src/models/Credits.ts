import mongoose, { Document, Schema, Types } from "mongoose";
import { CreditTransactionType, CreditTransactionSource } from "./enums.js";

// ── Wallet ───────────────────────────────────────────────────
// One wallet per User. Created automatically on user registration.

export interface IWallet extends Document {
  userId: Types.ObjectId;
  balance: number; // Current credit balance
  totalPurchased: number; // Lifetime credits purchased
  totalSpent: number; // Lifetime credits spent
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, required: true, default: 0, min: 0 },
    totalPurchased: { type: Number, required: true, default: 0, min: 0 },
    totalSpent: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

export const Wallet = mongoose.model<IWallet>("Wallet", WalletSchema);

// ── CreditPack ───────────────────────────────────────────────
// Admin-configured credit bundles available for purchase via Stripe.

export interface ICreditPack extends Document {
  name: string;
  credits: number; // Number of credits granted on purchase
  stripePriceId: string; // Stripe Price ID for checkout
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CreditPackSchema = new Schema<ICreditPack>(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    stripePriceId: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const CreditPack = mongoose.model<ICreditPack>(
  "CreditPack",
  CreditPackSchema,
);

// ── CreditTransaction ────────────────────────────────────────
// Immutable ledger entry for every credit movement on a Wallet.
// Provides a full audit trail for purchases, spends, bonuses,
// and refunds.

export interface ICreditTransaction extends Document {
  walletId: Types.ObjectId;
  type: CreditTransactionType;
  source: CreditTransactionSource;
  amount: number; // Positive = credits added; negative = credits deducted
  balanceAfter: number; // Wallet balance immediately after this transaction
  meta?: Record<string, unknown>; // e.g. { stripePaymentIntentId, creditPackId }
  createdAt: Date;
  updatedAt: Date;
}

const CreditTransactionSchema = new Schema<ICreditTransaction>(
  {
    walletId: {
      type: Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(CreditTransactionType),
      required: true,
    },
    source: {
      type: String,
      enum: Object.values(CreditTransactionSource),
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

CreditTransactionSchema.index({ walletId: 1, createdAt: -1 });

export const CreditTransaction = mongoose.model<ICreditTransaction>(
  "CreditTransaction",
  CreditTransactionSchema,
);
