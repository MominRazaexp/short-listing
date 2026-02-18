import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db/mongoose";
import { getGmail } from "@/lib/gmail/client";
import { GmailWatchState } from "@/lib/models/GmailWatchState";

export const runtime = "nodejs";

function isAuthorized(req: Request) {
  const cron = process.env.CRON_SECRET || "";
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  if (!cron) return true;           // allow if not set (not recommended)
  return bearer === cron;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const topicName = process.env.PUBSUB_TOPIC_NAME;
  if (!topicName) {
    return NextResponse.json({ ok: false, error: "Missing PUBSUB_TOPIC_NAME" }, { status: 500 });
  }

  await dbConnect();

  const gmail = await getGmail();
  const res = await gmail.users.watch({
    userId: "me",
    requestBody: {
      topicName,
      // Keep it simple: INBOX changes. (Sender filtering happens in push handler.)
      labelIds: ["INBOX"],
      labelFilterAction: "include",
    },
  });

  const historyId = res.data.historyId ? String(res.data.historyId) : "";
  const expiration = res.data.expiration ? String(res.data.expiration) : "";

  if (!historyId) {
    return NextResponse.json({ ok: false, error: "watch() missing historyId" }, { status: 500 });
  }

  await GmailWatchState.updateOne(
    { key: "singleton" },
    { $set: { lastHistoryId: historyId, watchExpiration: expiration } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, topicName, historyId, expiration });
}

export async function GET(req: Request) {
  return POST(req);
}
