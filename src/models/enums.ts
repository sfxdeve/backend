export const Role = ["USER", "ADMIN"] as const;
export type Role = (typeof Role)[number];

export const Gender = ["M", "W"] as const;
export type Gender = (typeof Gender)[number];

export const TournamentStatus = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export type TournamentStatus = (typeof TournamentStatus)[number];

export const EntryStatus = ["POOL", "QUALIFICATION", "RESERVE"] as const;
export type EntryStatus = (typeof EntryStatus)[number];

export const MatchPhase = [
  "QUALIFICATION",
  "POOL",
  "MAIN_R12",
  "MAIN_QF",
  "MAIN_SF",
  "MAIN_FINAL",
  "MAIN_3RD",
] as const;
export type MatchPhase = (typeof MatchPhase)[number];

export const MatchResult = ["2_0", "2_1", "0_2", "1_2"] as const;
export type MatchResult = (typeof MatchResult)[number];

export const OtpPurpose = ["VERIFY_EMAIL", "RESET_PASSWORD"] as const;
export type OtpPurpose = (typeof OtpPurpose)[number];

export const PoolRound = ["INITIAL", "WINNERS", "LOSERS"] as const;
export type PoolRound = (typeof PoolRound)[number];

export const LeagueStatus = [
  "REGISTRATION_OPEN",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export type LeagueStatus = (typeof LeagueStatus)[number];

export const CreditTransactionType = [
  "PURCHASE",
  "SPEND",
  "BONUS",
  "REFUND",
] as const;
export type CreditTransactionType = (typeof CreditTransactionType)[number];

export const CreditTransactionSource = ["STRIPE", "ADMIN", "SYSTEM"] as const;
export type CreditTransactionSource = (typeof CreditTransactionSource)[number];
