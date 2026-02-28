import mongoose from "mongoose";

const processedPaymentSchema = new mongoose.Schema({
  stripeEventId: { type: String, required: true, unique: true },
});

export const ProcessedPayment = mongoose.model(
  "ProcessedPayment",
  processedPaymentSchema,
);
