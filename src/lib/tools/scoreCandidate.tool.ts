import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { scoreCandidate } from "@/lib/chains/scoreCandidate";

export const scoreCandidateTool = new DynamicStructuredTool({
  name: "scoreCandidate",
  description: "Score candidate using JD + role + profile.",
  schema: z.object({
    jd: z.string(),
    role: z.string(),
    profile: z.any(),
  }),
  func: async ({ jd, role, profile }) => scoreCandidate({ jd, role, profile }),
});
