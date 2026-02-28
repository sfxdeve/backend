import mongoose from "mongoose";

export const AuditLogType = {
  MATCH_SCORE_UPDATE: "MATCH_SCORE_UPDATE",
  MATCH_CORRECTED: "MATCH_CORRECTED",
  RECOMPUTE_RUN: "RECOMPUTE_RUN",
  LINEUP_LOCKED: "LINEUP_LOCKED",
  ADMIN_ACTION: "ADMIN_ACTION",
} as const;
export type AuditLogType = (typeof AuditLogType)[keyof typeof AuditLogType];

const auditLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: Object.values(AuditLogType),
      required: true,
    },
    entity: { type: String, required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    by: { type: String, required: true }, // userId string or "system"
    meta: { type: mongoose.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

auditLogSchema.index({ type: 1, tournamentId: 1, createdAt: -1 });
auditLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
); // TTL 90 days

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
