import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createTrelloCard } from "@/lib/integrations/trello";

export const createTrelloCardTool = new DynamicStructuredTool({
  name: "createTrelloCard",
  description: "Create a Trello card using name + desc.",
  schema: z.object({ name: z.string().min(1), desc: z.string().min(1) }),
  func: async ({ name, desc }) => {
    await createTrelloCard({ name, desc });
    return { ok: true };
  },
});
