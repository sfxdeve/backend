import mongoose, { type Types } from "mongoose";
import { Gender, TournamentStatus, MatchPhase } from "./enums.js";

interface IScoringTable {
  QUALIFICATION: number;
  POOL: number;
  MAIN_R12: number;
  MAIN_QF: number;
  MAIN_SF: number;
  MAIN_FINAL: number;
  MAIN_3RD: number;
  bonusWin2_0: number;
  bonusWin2_1: number;
}

export interface ITournament {
  seasonId: Types.ObjectId;
  name: string;
  location: string;
  gender: string;
  status: string;
  startDate: Date;
  endDate: Date;
  lineupLockAt: Date;
  rosterSize: number;
  officialUrl?: string;
  scoringTable: IScoringTable;
  priceVolatilityFactor?: number;
  priceFloor?: number;
  priceCap?: number;
  marketWindowOpen: boolean;
}

const defaultScoringTable = {
  QUALIFICATION: 1,
  POOL: 2,
  MAIN_R12: 3,
  MAIN_QF: 5,
  MAIN_SF: 8,
  MAIN_3RD: 10,
  MAIN_FINAL: 13,
  bonusWin2_0: 2,
  bonusWin2_1: 1,
};

const scoringTableSchema = new mongoose.Schema(
  {
    QUALIFICATION: { type: Number, default: defaultScoringTable.QUALIFICATION },
    POOL: { type: Number, default: defaultScoringTable.POOL },
    MAIN_R12: { type: Number, default: defaultScoringTable.MAIN_R12 },
    MAIN_QF: { type: Number, default: defaultScoringTable.MAIN_QF },
    MAIN_SF: { type: Number, default: defaultScoringTable.MAIN_SF },
    MAIN_3RD: { type: Number, default: defaultScoringTable.MAIN_3RD },
    MAIN_FINAL: { type: Number, default: defaultScoringTable.MAIN_FINAL },
    bonusWin2_0: { type: Number, default: defaultScoringTable.bonusWin2_0 },
    bonusWin2_1: { type: Number, default: defaultScoringTable.bonusWin2_1 },
  },
  { _id: false },
);

const tournamentSchema = new mongoose.Schema({
  seasonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Season",
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  location: { type: String, required: true },
  gender: { type: String, required: true, enum: Object.values(Gender) },
  status: {
    type: String,
    required: true,
    enum: Object.values(TournamentStatus),
    default: TournamentStatus.UPCOMING,
    index: true,
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  lineupLockAt: { type: Date, required: true },
  rosterSize: { type: Number, default: 7, min: 4, max: 30 },
  officialUrl: { type: String },
  scoringTable: {
    type: scoringTableSchema,
    required: true,
    default: () => ({ ...defaultScoringTable }),
  },
  priceVolatilityFactor: { type: Number, default: 1.0 },
  priceFloor: { type: Number, default: 10 },
  priceCap: { type: Number, default: 200 },
  marketWindowOpen: { type: Boolean, default: false },
});

tournamentSchema.index({ seasonId: 1, status: 1 });

export const Tournament = mongoose.model<ITournament>("Tournament", tournamentSchema);
