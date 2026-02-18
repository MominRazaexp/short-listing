import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { dbConnect } from "@/lib/db/mongoose";
import { CandidateResult } from "@/lib/models/CandidateResult";

export const saveCandidateResultTool = new DynamicStructuredTool({
  name: "saveCandidateResult",
  description: "Save candidate result to MongoDB (CandidateResult).",
  schema: z.object({
    dry: z.boolean().optional().default(false),
    source: z.string().optional().default(""),
    jobTitle: z.string().optional().default(""),
    applied_role: z.string().optional().default(""),
    emailMessageId: z.string().min(1),
    profile: z.any(),
    score: z.any(),
    shortlisted: z.boolean(),
  }),
  func: async ({ dry, ...doc }) => {
    if (dry) return { mongoId: null, skipped: true };
    await dbConnect();
    const created = await CandidateResult.create(doc);
    return { mongoId: String(created._id), skipped: false };
  },
});
