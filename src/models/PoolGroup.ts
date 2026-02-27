import { Schema, model } from "mongoose";

const slotSchema = new Schema(
  {
    position: {
      type: String,
      enum: ["A", "B", "C", "D"],
      required: true,
    },
    pairId: { type: Schema.Types.ObjectId, ref: "Pair" },
    finalRank: { type: Number }, // 1–4, set after pool completes
  },
  { _id: false },
);

const poolGroupSchema = new Schema(
  {
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
      index: true,
    },
    name: { type: String, required: true }, // "Pool A", "Pool B", etc.
    poolIndex: { type: Number, required: true }, // 0–3
    slots: [slotSchema],
  },
  { timestamps: true },
);

poolGroupSchema.index({ tournamentId: 1, poolIndex: 1 }, { unique: true });

export const PoolGroup = model("PoolGroup", poolGroupSchema);
