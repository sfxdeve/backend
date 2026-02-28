import mongoose, { type Types } from "mongoose";

export interface ICreditPack {
  _id: Types.ObjectId;
  name: string;
  credits: number;
  stripePriceId: string;
  active: boolean;
}

const creditPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: 1 },
  stripePriceId: { type: String, required: true },
  active: { type: Boolean, default: true, index: true },
});

export const CreditPack = mongoose.model<ICreditPack>(
  "CreditPack",
  creditPackSchema,
);
