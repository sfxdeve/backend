import { Schema, model } from "mongoose";

const tournamentInvitationSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    invitedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

tournamentInvitationSchema.index(
  { tournamentId: 1, userId: 1 },
  { unique: true },
);

export const TournamentInvitation = model(
  "TournamentInvitation",
  tournamentInvitationSchema,
);
