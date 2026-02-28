import mongoose, { type Types } from "mongoose";

export interface IWallet {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  balance: number;
  totalPurchased: number;
  totalSpent: number;
}

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  balance: { type: Number, default: 0 },
  totalPurchased: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
});

export const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
