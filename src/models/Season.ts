import mongoose from "mongoose";
import { Gender } from "./enums.js";

const seasonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  gender: { type: String, required: true, enum: Object.values(Gender) },
  isActive: { type: Boolean, default: true, index: true },
});

export const Season = mongoose.model("Season", seasonSchema);
