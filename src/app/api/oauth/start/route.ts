import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const redirectUri = `${process.env.FRONTEND_URI}api/oauth/callback`;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { ok: false, error: "Missing env: GMAIL_CLIENT_ID or GMAIL_REDIRECT_URI" },
      { status: 500 }
    );
  }

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId.trim());
  url.searchParams.set("redirect_uri", redirectUri.trim());
  url.searchParams.set("response_type", "code");

  url.searchParams.set("scope", "https://www.googleapis.com/auth/gmail.modify");

  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");

  return NextResponse.redirect(url.toString());
}