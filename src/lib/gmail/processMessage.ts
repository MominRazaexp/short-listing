import { processCandidateToolChain } from "@/lib/chains/processCandidateToolChain";

export type ProcessOpts = {
  dry?: boolean;
  test?: boolean;
  markRead?: boolean;
};

export async function processGmailMessage(gmailMessageId: string, opts: ProcessOpts) {
console.log("🔥 PROCESS MESSAGE START", gmailMessageId);
  return processCandidateToolChain.invoke({
    gmailMessageId,
    dry: !!opts.dry,
    test: !!opts.test,
    markRead: !!opts.markRead,
  });
}
