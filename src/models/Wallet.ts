import { Schema, model } from "mongoose";

const walletSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    balance: { type: Number, required: true, default: 0 },
    totalPurchased: { type: Number, required: true, default: 0 },
    totalSpent: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

export const Wallet = model("Wallet", walletSchema);
