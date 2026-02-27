import { Schema, model } from "mongoose";
import { EntryStatus } from "./enums.js";

const tournamentEntrySchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    pairId: {
      type: Schema.Types.ObjectId,
      ref: "Pair",
      required: true,
    },
    entryStatus: {
      type: String,
      enum: EntryStatus,
      required: true,
    },
    seedRank: { type: Number },
    reserveOrder: { type: Number }, // 1, 2, 3 — only for RESERVE status
  },
  { timestamps: true },
);

tournamentEntrySchema.index({ tournamentId: 1, pairId: 1 }, { unique: true });
tournamentEntrySchema.index({ tournamentId: 1, entryStatus: 1 });

export const TournamentEntry = model("TournamentEntry", tournamentEntrySchema);
