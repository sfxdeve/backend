/**
 * Shared enums for model fields. Each enum is exported as const object + type.
 */

// Auth
export const Role = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OtpPurpose = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  RESET_PASSWORD: "RESET_PASSWORD",
} as const;
export type OtpPurpose = (typeof OtpPurpose)[keyof typeof OtpPurpose];

// Competition
export const Gender = {
  M: "M",
  W: "W",
} as const;
export type Gender = (typeof Gender)[keyof typeof Gender];

export const TournamentStatus = {
  UPCOMING: "UPCOMING",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
} as const;
export type TournamentStatus =
  (typeof TournamentStatus)[keyof typeof TournamentStatus];

export const MatchStatus = {
  SCHEDULED: "SCHEDULED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
} as const;
export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

// Payments
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
