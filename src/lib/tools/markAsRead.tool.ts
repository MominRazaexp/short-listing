import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { markAsRead } from "@/lib/gmail/fetchIndeedEmails";

export const markAsReadTool = new DynamicStructuredTool({
  name: "markAsRead",
  description: "Mark Gmail message as read.",
  schema: z.object({ messageId: z.string().min(1) }),
  func: async ({ messageId }) => {
    await markAsRead(messageId);
    return { ok: true };
  },
});
