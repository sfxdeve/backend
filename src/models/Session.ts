import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userAgent: { type: String },
    isRevoked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

sessionSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 30 * 24 * 60 * 60 },
); // 30 days TTL

export const Session = mongoose.model("Session", sessionSchema);
