import { Schema, model } from "mongoose";

const lineupSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    // Exactly 4 — order does not matter for scoring
    starters: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    // Exactly 3 — array order = substitution priority (index 0 = first sub)
    reserves: [{ type: Schema.Types.ObjectId, ref: "Player" }],
    lockedAt: { type: Date },
  },
  { timestamps: true },
);

lineupSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });
lineupSchema.index({ tournamentId: 1 });

export const Lineup = model("Lineup", lineupSchema);
