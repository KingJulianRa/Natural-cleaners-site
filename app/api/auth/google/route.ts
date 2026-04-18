import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getGoogleRedirectUri } from "@/lib/google-oauth";

export async function GET() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ error: "Missing GOOGLE_CLIENT_ID in .env.local" }, { status: 500 });
  }

  if (!process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json({ error: "Missing GOOGLE_CLIENT_SECRET in .env.local" }, { status: 500 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri()
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/calendar"],
  });

  return NextResponse.redirect(authUrl);
}
