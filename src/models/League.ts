import mongoose from "mongoose";
import { LeagueGameMode, LeagueStatus } from "./enums.js";

const leagueSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  isPublic: { type: Boolean, required: true, index: true },
  inviteCode: { type: String, sparse: true, unique: true },
  status: {
    type: String,
    required: true,
    enum: Object.values(LeagueStatus),
    default: LeagueStatus.REGISTRATION_OPEN,
  },
  gameMode: {
    type: String,
    required: true,
    enum: Object.values(LeagueGameMode),
    default: LeagueGameMode.CLASSIC,
  },
  entryFee: { type: Number, default: 0 },
  maxMembers: { type: Number },
});

leagueSchema.index({ tournamentId: 1, status: 1 });
leagueSchema.index({ isPublic: 1 });

export const League = mongoose.model("League", leagueSchema);
