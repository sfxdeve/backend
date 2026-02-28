import mongoose from "mongoose";
import { CreditTransactionType, CreditTransactionSource } from "./enums.js";

const creditTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(CreditTransactionType),
    },
    source: {
      type: String,
      required: true,
      enum: Object.values(CreditTransactionSource),
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true },
);

export const CreditTransaction = mongoose.model(
  "CreditTransaction",
  creditTransactionSchema,
);
