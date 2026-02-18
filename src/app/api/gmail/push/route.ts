import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { getGmail } from "@/lib/gmail/client";
import { GmailWatchState } from "@/lib/models/GmailWatchState";
import { processGmailMessage } from "@/lib/gmail/processMessage";

export const runtime = "nodejs";

type PubSubPushBody = {
  message?: { data?: string; messageId?: string; attributes?: Record<string, string> };
  subscription?: string;
};

function decodePubSubData(b64: string) {
  const json = Buffer.from(b64, "base64").toString("utf8");
  return JSON.parse(json) as { emailAddress: string; historyId: string };
}

function parseAllowedFrom(): string[] {
  const raw = process.env.GMAIL_ALLOWED_FROM || "";
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function getFromHeader(messageId: string): Promise<string> {
  const gmail = await getGmail();
  const msg = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["From"],
  });

  const headers = msg.data.payload?.headers || [];
  const from = headers.find((h) => (h.name || "").toLowerCase() === "from")?.value || "";
  return from.toLowerCase();
}

function matchesAllowed(fromHeaderLower: string, allowed: string[]) {

  return allowed.some((a) => fromHeaderLower.includes(a));
}

async function listNewMessageIds(startHistoryId: string) {
  const gmail = await getGmail();
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (true) {
    const res = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
      pageToken,
    });

    for (const h of res.data.history || []) {
      for (const added of h.messagesAdded || []) {
        if (added.message?.id) ids.push(added.message.id);
      }
    }

    pageToken = res.data.nextPageToken || undefined;
    if (!pageToken) break;
  }

  return Array.from(new Set(ids));
}

export async function POST(req: Request) {
  const u = new URL(req.url);
  const gotToken = u.searchParams.get("token") || "";
  const expectedToken = process.env.PUBSUB_VERIFICATION_TOKEN || "";
  if (expectedToken && gotToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as PubSubPushBody;
  const dataB64 = body.message?.data;
  if (!dataB64) return NextResponse.json({ ok: true, ignored: true });

  const { emailAddress, historyId } = decodePubSubData(dataB64);

  await dbConnect();

  const state = await GmailWatchState.findOne({ key: "singleton" }).lean();
  const lastHistoryId = state?.lastHistoryId || "";

  if (!lastHistoryId) {
    await GmailWatchState.updateOne(
      { key: "singleton" },
      { $set: { lastHistoryId: String(historyId) } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, primed: true, emailAddress, historyId });
  }

  let ids: string[] = [];
  try {
    ids = await listNewMessageIds(lastHistoryId);
  } catch (e: any) {
    await GmailWatchState.updateOne(
      { key: "singleton" },
      { $set: { lastHistoryId: String(historyId) } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true, reset: true, reason: e?.message || "history error" });
  }

  const allowed = parseAllowedFrom();
  const max = Number(process.env.POLL_MAX || "10");
  const markRead = process.env.POLL_MARK_READ === "1";

  const results: any[] = [];
  let matched = 0;

  for (const id of ids.slice(0, max)) {
    try {
      if (allowed.length) {
        const fromHeaderLower = await getFromHeader(id);
        if (!matchesAllowed(fromHeaderLower, allowed)) {
          continue;
        }
      }

      matched++;
      const r = await processGmailMessage(id, { dry: false, test: false, markRead });
      results.push(r);
    } catch (e: any) {
      results.push({ messageId: id, ok: false, error: e?.message || "push processing error" });
    }
  }

  await GmailWatchState.updateOne(
    { key: "singleton" },
    { $set: { lastHistoryId: String(historyId) } },
    { upsert: true }
  );

  return NextResponse.json({
    ok: true,
    emailAddress,
    historyId,
    received: ids.length,
    matched,
    processed: results.length,
    results,
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, note: "Use POST (Pub/Sub pushes here)" });
}
