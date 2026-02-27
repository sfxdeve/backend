import { Schema, model } from "mongoose";

const teamSchema = new Schema(
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
    playerIds: [{ type: Schema.Types.ObjectId, ref: "Player" }],
  },
  { timestamps: true },
);

teamSchema.index({ userId: 1, tournamentId: 1 }, { unique: true });
teamSchema.index({ tournamentId: 1 });

export const Team = model("Team", teamSchema);
