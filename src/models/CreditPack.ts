import mongoose from "mongoose";

const creditPackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: 1 },
  stripePriceId: { type: String, required: true },
  active: { type: Boolean, default: true, index: true },
});

export const CreditPack = mongoose.model("CreditPack", creditPackSchema);
