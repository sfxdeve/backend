import mongoose from "mongoose";
import { MatchPhase, MatchStatus, MatchResult, PoolRound } from "./enums.js";

const setSchema = new mongoose.Schema(
  {
    home: { type: Number, required: true },
    away: { type: Number, required: true },
  },
  { _id: false },
);

const correctionEntrySchema = new mongoose.Schema(
  {
    at: { type: Date, required: true },
    previousSets: [setSchema],
    by: { type: String, required: true },
  },
  { _id: false },
);

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  phase: { type: String, required: true, enum: Object.values(MatchPhase) },
  status: {
    type: String,
    required: true,
    enum: Object.values(MatchStatus),
    default: MatchStatus.SCHEDULED,
  },
  matchId: { type: String, required: true, unique: true },
  poolGroupId: { type: mongoose.Schema.Types.ObjectId, ref: "PoolGroup" },
  poolRound: { type: String, enum: Object.values(PoolRound) },
  bracketSlot: { type: Number },
  homePairId: { type: mongoose.Schema.Types.ObjectId, ref: "Pair" },
  awayPairId: { type: mongoose.Schema.Types.ObjectId, ref: "Pair" },
  scheduledAt: { type: Date, required: true },
  playedAt: { type: Date },
  sets: [setSchema],
  result: { type: String, enum: Object.values(MatchResult) },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: "Pair" },
  loserId: { type: mongoose.Schema.Types.ObjectId, ref: "Pair" },
  isCompleted: { type: Boolean, default: false },
  scoringDone: { type: Boolean, default: false },
  versionNumber: { type: Number, default: 0 },
  correctionHistory: [correctionEntrySchema],
});

matchSchema.index({ tournamentId: 1, phase: 1 });
matchSchema.index({ tournamentId: 1, isCompleted: 1 });
matchSchema.index({ tournamentId: 1, bracketSlot: 1 });

export const Match = mongoose.model("Match", matchSchema);
