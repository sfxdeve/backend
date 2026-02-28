import mongoose, { Document, Schema, Types } from "mongoose";
import { Role, OtpPurpose } from "./enums.js";

// ── User ─────────────────────────────────────────────────────

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
      required: true,
    },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>("User", UserSchema);

// ── Session ──────────────────────────────────────────────────

export interface ISession extends Document {
  userId: Types.ObjectId;
  userAgent: string;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userAgent: { type: String, default: "" },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// TTL: documents expire 30 days after createdAt
SessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
);

export const Session = mongoose.model<ISession>("Session", SessionSchema);

// ── OTP ──────────────────────────────────────────────────────

export interface IOtp extends Document {
  userId: Types.ObjectId;
  purpose: OtpPurpose;
  hash: string;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  purpose: { type: String, enum: Object.values(OtpPurpose), required: true },
  hash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});

OtpSchema.index({ userId: 1, purpose: 1 });
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL: auto-expire at expiresAt

export const Otp = mongoose.model<IOtp>("Otp", OtpSchema);
