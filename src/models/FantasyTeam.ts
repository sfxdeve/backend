import mongoose, { type Types } from "mongoose";

export interface IFantasyTeam {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tournamentId: Types.ObjectId;
  playerIds: Types.ObjectId[];
}

const fantasyTeamSchema = new mongoose.Schema({
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
});

fantasyTeamSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });

export const FantasyTeam = mongoose.model<IFantasyTeam>(
  "FantasyTeam",
  fantasyTeamSchema,
);
