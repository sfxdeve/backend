import { Schema, model } from "mongoose";
import { CreditTransactionType, CreditTransactionSource } from "./enums.js";

const creditTransactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    type: {
      type: String,
      enum: CreditTransactionType,
      required: true,
    },
    source: {
      type: String,
      enum: CreditTransactionSource,
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
    balanceAfter: { type: Number },
  },
  { timestamps: true },
);

creditTransactionSchema.index({ userId: 1, createdAt: -1 });

export const CreditTransaction = model(
  "CreditTransaction",
  creditTransactionSchema,
);
