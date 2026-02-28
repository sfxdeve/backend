import mongoose from "mongoose";

const leagueMemberSchema = new mongoose.Schema({
  leagueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "League",
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  totalPoints: { type: Number, default: 0 },
});

leagueMemberSchema.index({ leagueId: 1, userId: 1 }, { unique: true });
leagueMemberSchema.index({ leagueId: 1, totalPoints: -1 });

export const LeagueMember = mongoose.model("LeagueMember", leagueMemberSchema);
