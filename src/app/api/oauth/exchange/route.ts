import { NextResponse } from "next/server";
import { google } from "googleapis";

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

  return NextResponse.json({
    ok: true,
    tokens: {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date
    }
  });
}
