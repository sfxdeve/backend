import { Schema, model } from "mongoose";

const processedPaymentSchema = new Schema(
  {
    stripePaymentIntentId: { type: String, required: true, unique: true },
  },
  { timestamps: true },
);

export const ProcessedPayment = model(
  "ProcessedPayment",
  processedPaymentSchema,
);
