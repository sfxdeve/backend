import { Schema, model } from "mongoose";

const seasonSchema = new Schema(
  {
    year: { type: Number, required: true, unique: true },
    label: { type: String, required: true },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Season = model("Season", seasonSchema);
