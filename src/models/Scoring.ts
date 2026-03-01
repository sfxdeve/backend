import mongoose, { Document, Schema, Types } from "mongoose";

// ── AthleteMatchPoints ────────────────────────────────────────
// Per-athlete scoring record for a specific match.
// Unique per (matchId, athleteId) — upserted on each cascade run.

export interface IAthleteMatchPoints extends Document {
  matchId: Types.ObjectId;
  tournamentId: Types.ObjectId;
  athleteId: Types.ObjectId;
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const AthleteMatchPointsSchema = new Schema<IAthleteMatchPoints>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: "Athlete",
      required: true,
    },
    basePoints: { type: Number, required: true, default: 0 },
    bonusPoints: { type: Number, required: true, default: 0 },
    totalPoints: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

AthleteMatchPointsSchema.index({ matchId: 1, athleteId: 1 }, { unique: true });
AthleteMatchPointsSchema.index({ tournamentId: 1, athleteId: 1 });

export const AthleteMatchPoints = mongoose.model<IAthleteMatchPoints>(
  "AthleteMatchPoints",
  AthleteMatchPointsSchema,
);
