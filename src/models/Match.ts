import { Schema, model } from "mongoose";
import { MatchPhase, MatchResult, PoolRound } from "./enums.js";

const setScoreSchema = new Schema(
  {
    home: { type: Number, required: true },
    away: { type: Number, required: true },
  },
  { _id: false },
);

const matchSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    phase: { type: String, enum: MatchPhase, required: true },

    // Pool phase fields
    poolGroupId: { type: Schema.Types.ObjectId, ref: "PoolGroup" },
    poolRound: { type: String, enum: PoolRound },

    // Bracket slot for auto-advancement (e.g. "QF1", "SF2", "R12_M3")
    bracketSlot: { type: String },
    // Source slots for auto-populating pairs when previous match completes
    // e.g. homeFedFrom: "QF1.winner" means homePairId comes from QF1's winner
    homeFedFrom: { type: String },
    awayFedFrom: { type: String },

    homePairId: { type: Schema.Types.ObjectId, ref: "Pair" },
    awayPairId: { type: Schema.Types.ObjectId, ref: "Pair" },

    scheduledAt: { type: Date },
    playedAt: { type: Date }, // set on result submission; used for scoring timestamp check

    sets: [setScoreSchema],
    result: { type: String, enum: MatchResult },
    winnerId: { type: Schema.Types.ObjectId, ref: "Pair" },
    loserId: { type: Schema.Types.ObjectId, ref: "Pair" },

    isCompleted: { type: Boolean, default: false },
    scoringDone: { type: Boolean, default: false }, // prevents double-scoring
  },
  { timestamps: true },
);

matchSchema.index({ tournamentId: 1, phase: 1 });
matchSchema.index({ tournamentId: 1, isCompleted: 1 });
matchSchema.index({ tournamentId: 1, bracketSlot: 1 }, { sparse: true });
matchSchema.index({ playedAt: 1 }, { sparse: true });

export const Match = model("Match", matchSchema);
