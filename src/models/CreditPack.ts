import { Schema, model } from "mongoose";

const creditPackSchema = new Schema(
  {
    name: { type: String, required: true },
    credits: { type: Number, required: true, min: 1 },
    stripePriceId: { type: String, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

creditPackSchema.index({ active: 1 });

export const CreditPack = model("CreditPack", creditPackSchema);
