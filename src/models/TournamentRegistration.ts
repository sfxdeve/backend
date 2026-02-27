import { Schema, model } from "mongoose";

const tournamentRegistrationSchema = new Schema(
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
    registeredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

tournamentRegistrationSchema.index(
  { userId: 1, tournamentId: 1 },
  { unique: true },
);
tournamentRegistrationSchema.index({ tournamentId: 1 });
tournamentRegistrationSchema.index({ userId: 1 });

export const TournamentRegistration = model(
  "TournamentRegistration",
  tournamentRegistrationSchema,
);
