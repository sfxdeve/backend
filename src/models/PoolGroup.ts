import mongoose from "mongoose";
import { Gender } from "./enums.js";

const poolGroupSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  gender: { type: String, required: true, enum: Object.values(Gender) },
  pairIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Pair" }],
});

export const PoolGroup = mongoose.model("PoolGroup", poolGroupSchema);
