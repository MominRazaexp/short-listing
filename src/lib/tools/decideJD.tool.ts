import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { decideJD } from "@/lib/jds";

export const decideJDTool = new DynamicStructuredTool({
  name: "decideJD",
  description: "Decide role and JD based on job title.",
  schema: z.object({ jobTitleRaw: z.string().default("") }),
  func: async ({ jobTitleRaw }) => decideJD(jobTitleRaw),
});
