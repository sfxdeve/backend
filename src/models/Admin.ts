import mongoose, { Document, Schema, Types } from "mongoose";

// ── AdminAuditLog ─────────────────────────────────────────────
// Immutable record of every admin data override.

export interface IAdminAuditLog extends Document {
  adminId: Types.ObjectId;
  action: string; // e.g. "UPDATE_MATCH", "UPDATE_ATHLETE"
  entity: string; // collection name
  entityId?: Types.ObjectId;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String },
  },
  { timestamps: true },
);

AdminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
AdminAuditLogSchema.index({ entity: 1, entityId: 1 });

export const AdminAuditLog = mongoose.model<IAdminAuditLog>(
  "AdminAuditLog",
  AdminAuditLogSchema,
);
