import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { readEmailHtml } from "@/lib/gmail/fetchIndeedEmails";

export const readEmailHtmlTool = new DynamicStructuredTool({
  name: "readEmailHtml",
  description: "Read Gmail message HTML by messageId.",
  schema: z.object({ messageId: z.string().min(1) }),
  func: async ({ messageId }) => {
    const { html, threadId } = await readEmailHtml(messageId);
    return { html, threadId, messageId };
  },
});
