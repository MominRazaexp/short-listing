import mongoose, { Schema } from "mongoose";

const CandidateResultSchema = new Schema(
  {
    source: String,
    jobTitle: String,
    applied_role: String,

 emailMessageId: { type: String, unique: true, index: true },
     resumeFileName: String,

    profile: { type: Object, required: true }, 
    score: { type: Object, required: true },  

    shortlisted: { type: Boolean, index: true },
  },
  { timestamps: true }
);

export const CandidateResult =
  mongoose.models.CandidateResult ||
  mongoose.model("CandidateResult", CandidateResultSchema);
