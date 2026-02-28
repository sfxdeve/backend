import mongoose, { type Types } from "mongoose";
import {
  CreditTransactionSource,
  CreditTransactionType,
} from "./enums.js";

export interface ICreditTransaction {
  _id: Types.ObjectId;
  walletId: Types.ObjectId;
  type: CreditTransactionType;
  source: CreditTransactionSource;
  amount: number;
  balanceAfter: number;
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

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

export const CreditTransaction = mongoose.model<ICreditTransaction>(
  "CreditTransaction",
  creditTransactionSchema,
);
