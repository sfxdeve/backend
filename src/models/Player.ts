import mongoose from "mongoose";
import { Gender } from "./enums.js";

const playerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  gender: { type: String, required: true, enum: Object.values(Gender) },
  nationality: { type: String },
  federationId: { type: String, sparse: true, unique: true },
  currentPrice: { type: Number, default: 100 },
  movingAveragePoints: { type: Number, default: 0 },
});

playerSchema.index({ lastName: 1, firstName: 1 });
playerSchema.index({ federationId: 1 }, { sparse: true });

export const Player = mongoose.model("Player", playerSchema);
