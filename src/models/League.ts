import mongoose, { type Types } from "mongoose";

export interface ILeague {
  _id: Types.ObjectId;
  tournamentId: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  isPublic: boolean;
  inviteCode?: string;
  memberIds: Types.ObjectId[];
}

const leagueSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Tournament",
    required: true,
    index: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  isPublic: { type: Boolean, required: true, index: true },
  inviteCode: { type: String, sparse: true, unique: true },
  memberIds: [
    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ],
});

leagueSchema.index({ isPublic: 1 });
leagueSchema.index({ tournamentId: 1 });

export const League = mongoose.model<ILeague>("League", leagueSchema);
