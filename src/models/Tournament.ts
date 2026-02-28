import mongoose, { type Types } from "mongoose";
import { TournamentStatus } from "./enums.js";

export interface ITournament {
  _id: Types.ObjectId;
  name: string;
  location: string;
  status: TournamentStatus;
  startDate: Date;
  endDate: Date;
  year: number;
}

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: Object.values(TournamentStatus),
    default: TournamentStatus.UPCOMING,
    index: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  year: { type: Number, required: true },
});

tournamentSchema.index({ year: 1, status: 1 });

export const Tournament = mongoose.model<ITournament>(
  "Tournament",
  tournamentSchema,
);
