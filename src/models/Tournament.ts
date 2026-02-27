import { Schema, model } from "mongoose";
import { Gender, TournamentStatus } from "./enums.js";

const tournamentSchema = new Schema(
  {
    seasonId: {
      type: Schema.Types.ObjectId,
      ref: "Season",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    location: { type: String, required: true },
    gender: { type: String, enum: Gender, required: true },
    status: {
      type: String,
      enum: TournamentStatus,
      default: "DRAFT",
    },
    isPublic: { type: Boolean, default: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    lineupLockAt: { type: Date, required: true },
    rosterSize: { type: Number, required: true, min: 4, max: 30 },
    bonusWin2_0: { type: Number, default: 3 },
    bonusWin2_1: { type: Number, default: 1 },
    officialUrl: { type: String },
  },
  { timestamps: true },
);

tournamentSchema.index({ seasonId: 1, gender: 1 });
tournamentSchema.index({ status: 1 });
tournamentSchema.index({ isPublic: 1, status: 1 });

export const Tournament = model("Tournament", tournamentSchema);
