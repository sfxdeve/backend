/**
 * Static bracket progression configuration for beach volleyball main draw.
 *
 * Structure (12-team main draw from 4 pools):
 *   - 4 pool winners seeded directly into QF (as "away" pairs for QF3/QF4 and home for QF3/QF4 — adjust per draw)
 *   - 8 remaining teams (2nd/3rd per pool) play R12 (6 matches)
 *   - 4 R12 winners + 4 pool direct-seeds = 8 → QF
 *   - QF losers from QF1/QF2 play 3RD, QF3/QF4 losers are eliminated
 *   - SF → FINAL + 3RD placement
 *
 * Pool winners seeding into QF is done via POOL advancement config (separate from main draw).
 * The keys here are bracketSlot strings on Match documents.
 */

export interface BracketSeat {
  slot: string;
  seat: "home" | "away";
}

export interface BracketProgression {
  winner?: BracketSeat;
  loser?: BracketSeat;
}

/**
 * Main draw bracket progression.
 * Pool winner seeding into QF is handled by the pool-to-bracket seeding map below.
 */
export const BRACKET_PROGRESSION: Record<string, BracketProgression> = {
  // Round of 12 (6 matches) — winners go to QF, losers are eliminated
  R12_M1: { winner: { slot: "QF1", seat: "home" } },
  R12_M2: { winner: { slot: "QF1", seat: "away" } },
  R12_M3: { winner: { slot: "QF2", seat: "home" } },
  R12_M4: { winner: { slot: "QF2", seat: "away" } },
  R12_M5: { winner: { slot: "QF3", seat: "home" } },
  R12_M6: { winner: { slot: "QF4", seat: "home" } },

  // Quarter-finals (4 matches)
  // QF1/QF2 losers play for 3rd place; QF3/QF4 losers are eliminated
  QF1: {
    winner: { slot: "SF1", seat: "home" },
    loser: { slot: "3RD", seat: "home" },
  },
  QF2: {
    winner: { slot: "SF1", seat: "away" },
    loser: { slot: "3RD", seat: "away" },
  },
  QF3: { winner: { slot: "SF2", seat: "home" } },
  QF4: { winner: { slot: "SF2", seat: "away" } },

  // Semi-finals (2 matches) — losers are already placed in 3RD (QF losers above)
  // SF losers don't overwrite — 3RD is already set from QF losers
  SF1: { winner: { slot: "FINAL", seat: "home" } },
  SF2: { winner: { slot: "FINAL", seat: "away" } },
};

/**
 * Pool phase winner/loser seeding into the main draw.
 * After each pool phase (WINNERS/LOSERS bracket match), pairs seed into R12.
 *
 * Beach volleyball pool seeding into main draw:
 *   Pool 0 winner → QF3 away (direct seed)
 *   Pool 1 winner → QF4 away (direct seed)
 *   Pool 2 winner → QF3 away... (adjust per competition rules)
 *   Pool 3 winner → QF4 away... (adjust per competition rules)
 *
 * Pool 2nd places → R12_M1/M2/M3 home
 * Pool 3rd places → R12_M1/M2/M3 away (or M4/M5/M6)
 *
 * NOTE: Exact pool→bracket seeding depends on competition draw rules.
 * This config is for a 4-pool, 3-team-per-pool format (12 teams total).
 */
export const POOL_WINNER_SEEDING: Record<string, BracketSeat> = {
  // Pool winners get direct QF berths
  POOL0_WINNERS: { slot: "QF3", seat: "away" },
  POOL1_WINNERS: { slot: "QF4", seat: "away" },
  POOL2_WINNERS: { slot: "QF3", seat: "home" }, // if pool winner isnates R12 first, adjust
  POOL3_WINNERS: { slot: "QF4", seat: "home" },
};

export const POOL_LOSER_SEEDING: Record<string, BracketSeat> = {
  // Pool losers (bracket losers) feed into R12
  POOL0_LOSERS: { slot: "R12_M5", seat: "away" },
  POOL1_LOSERS: { slot: "R12_M6", seat: "away" },
  POOL2_LOSERS: { slot: "R12_M5", seat: "home" }, // already set by POOL0_LOSERS winner? revisit
  POOL3_LOSERS: { slot: "R12_M6", seat: "home" },
};

/**
 * All slots in order for generateBracket() to create.
 */
export const MAIN_DRAW_SLOTS: Array<{ slot: string; phase: string }> = [
  { slot: "R12_M1", phase: "MAIN_R12" },
  { slot: "R12_M2", phase: "MAIN_R12" },
  { slot: "R12_M3", phase: "MAIN_R12" },
  { slot: "R12_M4", phase: "MAIN_R12" },
  { slot: "R12_M5", phase: "MAIN_R12" },
  { slot: "R12_M6", phase: "MAIN_R12" },
  { slot: "QF1", phase: "MAIN_QF" },
  { slot: "QF2", phase: "MAIN_QF" },
  { slot: "QF3", phase: "MAIN_QF" },
  { slot: "QF4", phase: "MAIN_QF" },
  { slot: "SF1", phase: "MAIN_SF" },
  { slot: "SF2", phase: "MAIN_SF" },
  { slot: "FINAL", phase: "MAIN_FINAL" },
  { slot: "3RD", phase: "MAIN_3RD" },
];
