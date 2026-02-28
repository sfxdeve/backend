import mongoose, { Document, Schema, Types } from "mongoose";
import { LeagueType, LeagueStatus, RankingMode, LineupRole } from "./enums.js";

// ── League ───────────────────────────────────────────────────

export interface ILeague extends Document {
  name: string;
  type: LeagueType;
  createdBy?: Types.ObjectId; // null when created by Admin on behalf of platform
  isOfficial: boolean;
  championshipId: Types.ObjectId;
  rankingMode: RankingMode;
  rosterSize: number;
  startersPerGameweek: number;
  // benchSize is derived: rosterSize - startersPerGameweek (not persisted)
  initialBudget: number; // Fantacoins issued to each user on join
  marketEnabled: boolean;
  status: LeagueStatus;
  entryFee?: number;
  prize1st?: string;
  prize2nd?: string;
  prize3rd?: string;
  inviteCode?: string; // Present only when type === PRIVATE
  createdAt: Date;
  updatedAt: Date;
}

const LeagueSchema = new Schema<ILeague>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(LeagueType),
      required: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    isOfficial: { type: Boolean, default: false },
    championshipId: {
      type: Schema.Types.ObjectId,
      ref: "Championship",
      required: true,
    },
    rankingMode: {
      type: String,
      enum: Object.values(RankingMode),
      required: true,
    },
    rosterSize: { type: Number, required: true, min: 1 },
    startersPerGameweek: { type: Number, required: true, min: 1 },
    initialBudget: { type: Number, required: true, min: 0 },
    marketEnabled: { type: Boolean, default: false },
    status: {
      type: String,
      enum: Object.values(LeagueStatus),
      default: LeagueStatus.OPEN,
    },
    entryFee: { type: Number },
    prize1st: { type: String },
    prize2nd: { type: String },
    prize3rd: { type: String },
    inviteCode: { type: String, sparse: true, unique: true },
  },
  { timestamps: true },
);

LeagueSchema.index({ type: 1, status: 1 });
LeagueSchema.index({ championshipId: 1 });
LeagueSchema.index({ isOfficial: 1 });

export const League = mongoose.model<ILeague>("League", LeagueSchema);

// ── LeagueMembership ─────────────────────────────────────────
// Tracks which Users have joined which Leagues and when they
// enrolled (used to enforce no-retroactive-points rule §11.1).

export interface ILeagueMembership extends Document {
  leagueId: Types.ObjectId;
  userId: Types.ObjectId;
  enrolledAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LeagueMembershipSchema = new Schema<ILeagueMembership>(
  {
    leagueId: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    enrolledAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

LeagueMembershipSchema.index({ leagueId: 1, userId: 1 }, { unique: true });
LeagueMembershipSchema.index({ userId: 1 });

export const LeagueMembership = mongoose.model<ILeagueMembership>(
  "LeagueMembership",
  LeagueMembershipSchema,
);

// ── FantasyTeam ──────────────────────────────────────────────
// A User's team within a League. One record per (user, league) pair.

export interface IFantasyTeam extends Document {
  leagueId: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  fantacoinsRemaining: number; // Current Fantacoin budget
  totalPoints: number; // Cumulative season fantasy points
  createdAt: Date;
  updatedAt: Date;
}

const FantasyTeamSchema = new Schema<IFantasyTeam>(
  {
    leagueId: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    fantacoinsRemaining: { type: Number, required: true, min: 0 },
    totalPoints: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// One fantasy team per user per league
FantasyTeamSchema.index({ leagueId: 1, userId: 1 }, { unique: true });
FantasyTeamSchema.index({ leagueId: 1, totalPoints: -1 }); // Standings query

export const FantasyTeam = mongoose.model<IFantasyTeam>(
  "FantasyTeam",
  FantasyTeamSchema,
);

// ── Roster ───────────────────────────────────────────────────
// Athletes owned by a FantasyTeam. Each entry records the purchase
// price at acquisition time and the current market value.

export interface IRoster extends Document {
  fantasyTeamId: Types.ObjectId;
  athleteId: Types.ObjectId;
  purchasePrice: number; // Fantacoins paid at time of acquisition
  currentValue: number; // Updated after each market window
  acquiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RosterSchema = new Schema<IRoster>(
  {
    fantasyTeamId: {
      type: Schema.Types.ObjectId,
      ref: "FantasyTeam",
      required: true,
    },
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: "Athlete",
      required: true,
    },
    purchasePrice: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
    acquiredAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

// Each athlete can appear only once per FantasyTeam roster
RosterSchema.index({ fantasyTeamId: 1, athleteId: 1 }, { unique: true });
RosterSchema.index({ fantasyTeamId: 1 });

export const Roster = mongoose.model<IRoster>("Roster", RosterSchema);

// ── Lineup ───────────────────────────────────────────────────
// A per-gameweek (per-tournament) lineup selection for a FantasyTeam.
// One Lineup per (fantasyTeamId, tournamentId) pair.

export interface ILineup extends Document {
  fantasyTeamId: Types.ObjectId;
  tournamentId: Types.ObjectId; // The gameweek this lineup applies to
  isLocked: boolean; // Set true at Thursday lineup lock
  autoGenerated: boolean; // True if system used fallback logic
  lockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LineupSchema = new Schema<ILineup>(
  {
    fantasyTeamId: {
      type: Schema.Types.ObjectId,
      ref: "FantasyTeam",
      required: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    isLocked: { type: Boolean, default: false },
    autoGenerated: { type: Boolean, default: false },
    lockedAt: { type: Date },
  },
  { timestamps: true },
);

LineupSchema.index({ fantasyTeamId: 1, tournamentId: 1 }, { unique: true });
LineupSchema.index({ tournamentId: 1, isLocked: 1 });

export const Lineup = mongoose.model<ILineup>("Lineup", LineupSchema);

// ── LineupSlot ───────────────────────────────────────────────
// Each slot within a Lineup identifies one athlete and their role
// (STARTER or BENCH) for that gameweek.

export interface ILineupSlot extends Document {
  lineupId: Types.ObjectId;
  athleteId: Types.ObjectId;
  role: LineupRole;
  benchOrder?: number; // Substitution priority (1 = first to come on)
  substitutedIn: boolean; // True if auto-subbed into STARTER role
  pointsScored: number; // Fantasy points earned this gameweek
  createdAt: Date;
  updatedAt: Date;
}

const LineupSlotSchema = new Schema<ILineupSlot>(
  {
    lineupId: {
      type: Schema.Types.ObjectId,
      ref: "Lineup",
      required: true,
    },
    athleteId: {
      type: Schema.Types.ObjectId,
      ref: "Athlete",
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(LineupRole),
      required: true,
    },
    benchOrder: { type: Number },
    substitutedIn: { type: Boolean, default: false },
    pointsScored: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Each athlete appears only once per lineup
LineupSlotSchema.index({ lineupId: 1, athleteId: 1 }, { unique: true });
LineupSlotSchema.index({ lineupId: 1, role: 1 });

export const LineupSlot = mongoose.model<ILineupSlot>(
  "LineupSlot",
  LineupSlotSchema,
);

// ── GameweekStanding ─────────────────────────────────────────
// Snapshot of each FantasyTeam's points for a specific gameweek.
// Written by the scoring cascade after all matches complete; used to
// build both OVERALL rankings and HEAD_TO_HEAD results without
// re-querying LineupSlot on every read.

export interface IGameweekStanding extends Document {
  leagueId: Types.ObjectId;
  fantasyTeamId: Types.ObjectId;
  tournamentId: Types.ObjectId;
  gameweekPoints: number;
  cumulativePoints: number; // Running total up to and including this gameweek
  rank: number; // Position within the league for this gameweek
  createdAt: Date;
  updatedAt: Date;
}

const GameweekStandingSchema = new Schema<IGameweekStanding>(
  {
    leagueId: {
      type: Schema.Types.ObjectId,
      ref: "League",
      required: true,
    },
    fantasyTeamId: {
      type: Schema.Types.ObjectId,
      ref: "FantasyTeam",
      required: true,
    },
    tournamentId: {
      type: Schema.Types.ObjectId,
      ref: "Tournament",
      required: true,
    },
    gameweekPoints: { type: Number, default: 0 },
    cumulativePoints: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },
  },
  { timestamps: true },
);

GameweekStandingSchema.index(
  { leagueId: 1, tournamentId: 1, fantasyTeamId: 1 },
  { unique: true },
);
GameweekStandingSchema.index({ leagueId: 1, tournamentId: 1, rank: 1 });

export const GameweekStanding = mongoose.model<IGameweekStanding>(
  "GameweekStanding",
  GameweekStandingSchema,
);
