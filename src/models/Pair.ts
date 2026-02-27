import { Schema, model } from "mongoose";

const pairSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    player1Id: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
    player2Id: {
      type: Schema.Types.ObjectId,
      ref: "Player",
      required: true,
    },
  },
  { timestamps: true },
);

pairSchema.index(
  { tournamentId: 1, player1Id: 1, player2Id: 1 },
  { unique: true },
);

export const Pair = model("Pair", pairSchema);
