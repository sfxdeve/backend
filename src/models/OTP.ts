import mongoose from "mongoose";
import { OtpPurpose } from "./enums.js";

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, required: true, enum: Object.values(OtpPurpose) },
  hash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

otpSchema.index({ userId: 1, purpose: 1 });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = mongoose.model("OTP", otpSchema);
