import mongoose from "mongoose";

const pairSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  player1Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  },
  player2Id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Player",
    required: true,
  },
});

pairSchema.index(
  { tournamentId: 1, player1Id: 1, player2Id: 1 },
  { unique: true },
);

export const Pair = mongoose.model("Pair", pairSchema);
