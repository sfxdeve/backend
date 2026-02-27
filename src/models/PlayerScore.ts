import { Schema, model } from "mongoose";
import { MatchPhase, MatchResult } from "./enums.js";

const playerScoreSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    playerId: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    pairId: {
      type: Schema.Types.ObjectId,
      ref: "Pair",
      required: true,
    },
    basePoints: { type: Number, required: true, default: 0 },
    bonusPoints: { type: Number, required: true, default: 0 },
    totalPoints: { type: Number, required: true, default: 0 },
    isWin: { type: Boolean, required: true },
    matchResult: { type: String, enum: MatchResult, required: true },
    phase: { type: String, enum: MatchPhase, required: true },
    playedAt: { type: Date, required: true }, // copied from Match.playedAt
  },
  { timestamps: true },
);

// Idempotency: one score record per player per match
playerScoreSchema.index({ matchId: 1, playerId: 1 }, { unique: true });
// Scoring queries: all scores for a player in a tournament, filtered by date
playerScoreSchema.index({ tournamentId: 1, playerId: 1 });
playerScoreSchema.index({ tournamentId: 1, playerId: 1, playedAt: 1 });

export const PlayerScore = model("PlayerScore", playerScoreSchema);
