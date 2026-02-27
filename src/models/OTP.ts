import { Schema, model } from "mongoose";
import { OtpPurpose } from "./enums.js";

const otpSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    purpose: { type: String, enum: OtpPurpose, required: true },
    hash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

otpSchema.index({ userId: 1, purpose: 1 });
// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OTP = model("OTP", otpSchema);
