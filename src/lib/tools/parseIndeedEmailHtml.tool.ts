import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { parseIndeedEmailHtml } from "@/lib/indeed/parseEmail";

export const parseIndeedEmailHtmlTool = new DynamicStructuredTool({
  name: "parseIndeedEmailHtml",
  description: "Parse Indeed email HTML and extract fields like resumeUrl, jobTitle, etc.",
  schema: z.object({ html: z.string() }),
  func: async ({ html }) => parseIndeedEmailHtml(html),
});
