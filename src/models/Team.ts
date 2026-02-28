import mongoose from "mongoose";

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
});

teamSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });

export const Team = mongoose.model("Team", teamSchema);
