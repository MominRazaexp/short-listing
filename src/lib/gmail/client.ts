import { google } from "googleapis";
import { dbConnect } from "@/lib/db/mongoose";
import { GmailWatchState } from "../models/GmailWatchState";

export async function saveRefreshToken(token: string) {
  await dbConnect();

  await GmailWatchState.findOneAndUpdate(
    { key: "singleton" },
    { refreshToken: token },
    { upsert: true, new: true }
  );
}

export async function loadRefreshToken(): Promise<string | null> {
  await dbConnect();

  const doc = await GmailWatchState.findOne({ key: "singleton" });
  return doc?.refreshToken || null;
}

export async function getGmail() {

  
  const id = process.env.GMAIL_CLIENT_ID || "";
  const secret = process.env.GMAIL_CLIENT_SECRET || "";
  const redirect = `${process.env.FRONTEND_URI}api/oauth/callback` || "";
  const refresh = await loadRefreshToken();
  
  console.log("GMAIL ENV CHECK:", {
    clientIdTail: id.slice(-8),
    redirect,
    refreshTail: refresh?.slice(-8),
    refreshLen: refresh?.length
  });

  if (!id || !secret || !redirect || !refresh) {
    throw new Error("Missing Gmail env vars");
  }

  const oauth2 = new google.auth.OAuth2(id, secret, redirect);
  oauth2.setCredentials({ refresh_token: refresh });

  return google.gmail({ version: "v1", auth: oauth2 });
}
