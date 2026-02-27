import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userAgent: { type: String },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Auto-expire sessions after 30 days
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export const Session = model("Session", sessionSchema);
