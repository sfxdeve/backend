import mongoose from "mongoose";
import { MatchPhase, MatchResult } from "./enums.js";

const playerScoreSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Match",
    required: true,
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  },
  pairId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pair",
    required: true,
  },
  basePoints: { type: Number, required: true },
  bonusPoints: { type: Number, required: true },
  totalPoints: { type: Number, required: true },
  isWin: { type: Boolean, required: true },
  matchResult: {
    type: String,
    required: true,
    enum: Object.values(MatchResult),
  },
  phase: { type: String, required: true, enum: Object.values(MatchPhase) },
  playedAt: { type: Date, required: true },
});

playerScoreSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
playerScoreSchema.index({ tournamentId: 1, playerId: 1 });
playerScoreSchema.index({ tournamentId: 1, playerId: 1, playedAt: 1 });

export const PlayerScore = mongoose.model("PlayerScore", playerScoreSchema);
