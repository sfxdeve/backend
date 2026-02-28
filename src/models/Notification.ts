import mongoose from "mongoose";

export const NotificationType = {
  LINEUP_LOCKED: "LINEUP_LOCKED",
  MATCH_RESULT: "MATCH_RESULT",
  STANDINGS_UPDATE: "STANDINGS_UPDATE",
  TOURNAMENT_FINALIZED: "TOURNAMENT_FINALIZED",
} as const;
export type NotificationType =
  (typeof NotificationType)[keyof typeof NotificationType];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 },
); // TTL 30 days

export const Notification = mongoose.model("Notification", notificationSchema);
