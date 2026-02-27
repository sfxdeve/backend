import { Schema, model } from "mongoose";
import { LeagueStatus } from "./enums.js";

const leagueSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    inviteCode: { type: String, sparse: true, unique: true },
    status: {
      type: String,
      enum: LeagueStatus,
      default: "REGISTRATION_OPEN",
      index: true,
    },
    startDate: { type: Date, required: true },
    playerAvailability: { type: String },
    gameMode: { type: String },
    typology: { type: String },
    banner: { type: String },
  },
  { timestamps: true },
);

leagueSchema.index({ isPublic: 1 });
leagueSchema.index({ tournamentId: 1, status: 1 });

export const League = model("League", leagueSchema);
