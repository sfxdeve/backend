import mongoose, { type Types } from "mongoose";
import { Gender } from "./enums.js";

export interface IPlayer {
  _id: Types.ObjectId;
  name: string;
  gender: Gender;
}

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true, enum: Object.values(Gender) },
});

playerSchema.index({ name: 1 });

export const Player = mongoose.model<IPlayer>("Player", playerSchema);
