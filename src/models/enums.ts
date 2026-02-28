export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Gender = {
  M: "M",
  W: "W",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const TournamentStatus = {
  UPCOMING: "UPCOMING",
  REGISTRATION_LOCKED: "REGISTRATION_LOCKED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  FINALIZED: "FINALIZED",
} as const;
export type TournamentStatus =
  (typeof TournamentStatus)[keyof typeof TournamentStatus];

export const MatchPhase = {
  QUALIFICATION: "QUALIFICATION",
  POOL: "POOL",
  MAIN_R12: "MAIN_R12",
  MAIN_QF: "MAIN_QF",
  MAIN_SF: "MAIN_SF",
  MAIN_FINAL: "MAIN_FINAL",
  MAIN_3RD: "MAIN_3RD",
} as const;
export type MatchPhase = (typeof MatchPhase)[keyof typeof MatchPhase];

export const MatchResult = {
  WIN_2_0: "WIN_2_0",
  WIN_2_1: "WIN_2_1",
  LOSS_0_2: "LOSS_0_2",
  LOSS_1_2: "LOSS_1_2",
} as const;
export type MatchResult = (typeof MatchResult)[keyof typeof MatchResult];

export const MatchStatus = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CORRECTED: "CORRECTED",
  LOCKED: "LOCKED",
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

export const LineupStatus = {
  DRAFT: "DRAFT",
  LOCKED: "LOCKED",
  APPLIED: "APPLIED",
  ARCHIVED: "ARCHIVED",
} as const;
export type LineupStatus = (typeof LineupStatus)[keyof typeof LineupStatus];

export const OtpPurpose = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  RESET_PASSWORD: "RESET_PASSWORD",
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

export const PoolRound = {
  INITIAL: "INITIAL",
  WINNERS: "WINNERS",
  LOSERS: "LOSERS",
} as const;
export type PoolRound = (typeof PoolRound)[keyof typeof PoolRound];

export const LeagueStatus = {
  REGISTRATION_OPEN: "REGISTRATION_OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;
export type LeagueStatus = (typeof LeagueStatus)[keyof typeof LeagueStatus];

export const LeagueGameMode = {
  CLASSIC: "CLASSIC",
  HEAD_TO_HEAD: "HEAD_TO_HEAD",
} as const;
export type LeagueGameMode =
  (typeof LeagueGameMode)[keyof typeof LeagueGameMode];

export const CreditTransactionType = {
  PURCHASE: "PURCHASE",
  SPEND: "SPEND",
  BONUS: "BONUS",
  REFUND: "REFUND",
} as const;
export type CreditTransactionType =
  (typeof CreditTransactionType)[keyof typeof CreditTransactionType];

export const CreditTransactionSource = {
  STRIPE: "STRIPE",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
} as const;
export type CreditTransactionSource =
  (typeof CreditTransactionSource)[keyof typeof CreditTransactionSource];
