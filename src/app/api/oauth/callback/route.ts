// app/api/oauth/callback/route.ts
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { saveRefreshToken } from "@/lib/gmail/client";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code");
  if (!code) return NextResponse.json({ ok: false, error: "Missing ?code=" }, { status: 400 });

  const oauth2 = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    `${process.env.FRONTEND_URI}api/oauth/callback`
  );

  const { tokens } = await oauth2.getToken(code);
  
   if (tokens.refresh_token) {
    await saveRefreshToken(tokens.refresh_token); 
  }

  return NextResponse.json({
    ok: true,
    tokens: {
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    },
  });
}
