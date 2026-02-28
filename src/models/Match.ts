import mongoose, { type Types } from "mongoose";
import { MatchStatus } from "./enums.js";

export interface IMatch {
  _id: Types.ObjectId;
  tournamentId: Types.ObjectId;
  status: MatchStatus;
  homePlayers: [Types.ObjectId, Types.ObjectId];
  awayPlayers: [Types.ObjectId, Types.ObjectId];
  homeScore: number;
  awayScore: number;
  scheduledAt: Date;
}

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(MatchStatus),
    default: MatchStatus.SCHEDULED,
  },
  homePlayers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  ],
  awayPlayers: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  ],
  homeScore: { type: Number, required: true, default: 0 },
  awayScore: { type: Number, required: true, default: 0 },
  scheduledAt: { type: Date, required: true },
});

matchSchema.index({ tournamentId: 1, status: 1 });

export const Match = mongoose.model<IMatch>("Match", matchSchema);
