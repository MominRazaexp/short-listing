import mongoose from "mongoose";

const GmailWatchStateSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: "singleton" },
    refreshToken: { type: String, default: "" }, 
    lastHistoryId: { type: String, default: "" },
    watchExpiration: { type: String, default: "" },
  },
  { timestamps: true }
);

export const GmailWatchState =
  mongoose.models.GmailWatchState ||
  mongoose.model("GmailWatchState", GmailWatchStateSchema);
