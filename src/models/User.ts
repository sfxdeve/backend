import { Schema, model } from "mongoose";
import { Role } from "./enums.js";

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: String,
    name: String,
    role: { type: String, enum: Role, default: "USER" },
    isBlocked: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
