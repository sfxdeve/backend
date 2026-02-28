export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export enum OtpPurpose {
  VERIFY_EMAIL = "VERIFY_EMAIL",
  RESET_PASSWORD = "RESET_PASSWORD",
}

export enum Gender {
  M = "M",
  F = "F",
}

// ── Real World ───────────────────────────────────────────────

export enum TournamentStatus {
  UPCOMING = "UPCOMING",
  REGISTRATION_OPEN = "REGISTRATION_OPEN",
  LOCKED = "LOCKED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

export enum EntryStatus {
  DIRECT = "DIRECT",
  QUALIFICATION = "QUALIFICATION",
  RESERVE_1 = "RESERVE_1",
  RESERVE_2 = "RESERVE_2",
  RESERVE_3 = "RESERVE_3",
}

export enum MatchRound {
  QUALIFICATION_R1 = "QUALIFICATION_R1",
  QUALIFICATION_R2 = "QUALIFICATION_R2",
  POOL = "POOL",
  R12 = "R12",
  QF = "QF",
  SF = "SF",
  FINAL = "FINAL",
  THIRD_PLACE = "THIRD_PLACE",
}

export enum MatchStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CORRECTED = "CORRECTED",
}

// ── Fantasy World ────────────────────────────────────────────

export enum LeagueType {
  PUBLIC = "PUBLIC",
  PRIVATE = "PRIVATE",
}

export enum LeagueStatus {
  OPEN = "OPEN",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

export enum RankingMode {
  OVERALL = "OVERALL",
  HEAD_TO_HEAD = "HEAD_TO_HEAD",
}

export enum LineupRole {
  STARTER = "STARTER",
  BENCH = "BENCH",
}

// ── Credits & Payments ───────────────────────────────────────

export enum CreditTransactionType {
  PURCHASE = "PURCHASE",
  SPEND = "SPEND",
  BONUS = "BONUS",
  REFUND = "REFUND",
}

export enum CreditTransactionSource {
  STRIPE = "STRIPE",
  ADMIN = "ADMIN",
  SYSTEM = "SYSTEM",
}
