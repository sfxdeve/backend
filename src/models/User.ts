import mongoose from "mongoose";
import { Role } from "./enums.js";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(Role) },
    isVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const User = mongoose.model("User", userSchema);
