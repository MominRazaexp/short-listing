import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { downloadAndExtractResumeText } from "@/lib/indeed/downloadResume";

export const downloadAndExtractResumeTool = new DynamicStructuredTool({
  name: "downloadAndExtractResume",
  description: "Download Indeed resume from URL and extract plain text.",
  schema: z.object({ resumeUrl: z.string().min(5) }),
  func: async ({ resumeUrl }) => {
    try {
      const out = await downloadAndExtractResumeText(resumeUrl);
      return { ...out, resumeDownloadFailed: false, resumeDownloadError: "" };
    } catch (e: any) {
      return {
        resumeText: "",
        resumeMime: "",
        finalUrl: resumeUrl,
        resumeDownloadFailed: true,
        resumeDownloadError: e?.message || String(e),
      };
    }
  },
});
