import { Schema, model } from "mongoose";

const leagueMemberSchema = new Schema(
  {
    leagueId: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    joinedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

leagueMemberSchema.index({ leagueId: 1, userId: 1 }, { unique: true });
leagueMemberSchema.index({ userId: 1 });

export const LeagueMember = model("LeagueMember", leagueMemberSchema);
