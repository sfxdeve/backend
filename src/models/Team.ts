import mongoose, { type Types } from "mongoose";

export interface ITeam {
  userId: Types.ObjectId;
  tournamentId: Types.ObjectId;
  playerIds: Types.ObjectId[];
  budgetSpent: number;
  registeredAt: Date;
}

const teamSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  playerIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Player", required: true },
  ],
  budgetSpent: { type: Number, required: true },
  registeredAt: { type: Date, default: Date.now, required: true },
});

teamSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });

export const Team = mongoose.model<ITeam>("Team", teamSchema);
