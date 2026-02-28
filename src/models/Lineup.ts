import mongoose, { type Types } from "mongoose";
import { LineupStatus } from "./enums.js";

export interface ILineup {
  userId: Types.ObjectId;
  tournamentId: Types.ObjectId;
  starters: Types.ObjectId[];
  reserves: Types.ObjectId[];
  status: string;
  lockedAt?: Date;
  totalPoints: number;
}

const lineupSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  starters: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  ],
  reserves: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  ],
  status: {
    type: String,
    required: true,
    enum: Object.values(LineupStatus),
    default: LineupStatus.DRAFT,
  },
  lockedAt: { type: Date },
  totalPoints: { type: Number, default: 0 },
});

lineupSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });

export const Lineup = mongoose.model<ILineup>("Lineup", lineupSchema);
