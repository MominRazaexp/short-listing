import { getGmail } from "./client";

export async function fetchUnreadIndeedEmailIds(max = 5) {
  const gmail = await getGmail();
  const from = process.env.GMAIL_FROM_FILTER || "indeed.com";

  const q = `is:unread from:${from}`;
  const list = await gmail.users.messages.list({
    userId: "me",
    q,
    maxResults: max
  });

  return (list.data.messages || []).map(m => m.id!).filter(Boolean);
}

export async function readEmailHtml(messageId: string) {
  const gmail = await getGmail();
  const msg = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
const headers = msg.data.payload?.headers || [];
const fromHeader = headers.find(h => h.name?.toLowerCase() === "from")?.value || "";
const subjectHeader = headers.find(h => h.name?.toLowerCase() === "subject")?.value || "";
console.log("HEADERS:", { fromHeader, subjectHeader });

  const parts = msg.data.payload?.parts || [];
  const htmlPart =
    parts.find(p => p.mimeType === "text/html") ||
    parts.flatMap(p => p.parts || []).find(p => p.mimeType === "text/html");

  const body = htmlPart?.body?.data;
  const html = body ? Buffer.from(body, "base64").toString("utf8") : "";

  return { html, threadId: msg.data.threadId || "", messageId };
}

export async function markAsRead(messageId: string) {
  const gmail = await getGmail();
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { removeLabelIds: ["UNREAD"] }
  });
}
