import { Schema, model } from "mongoose";
import { Gender } from "./enums.js";

const playerSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    gender: { type: String, enum: Gender, required: true },
    federationId: { type: String, sparse: true },
  },
  { timestamps: true },
);

playerSchema.index({ lastName: 1, firstName: 1 });
playerSchema.index({ gender: 1 });
playerSchema.index({ federationId: 1 }, { sparse: true });

export const Player = model("Player", playerSchema);
