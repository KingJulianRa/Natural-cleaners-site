import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleRedirectUri } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    getGoogleRedirectUri()
  );

  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: getGoogleRedirectUri(),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000";
  const response = NextResponse.redirect(`${appUrl}/schedule`);

  if (tokens.access_token) {
    response.cookies.set("google_access_token", tokens.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  }

  if (tokens.refresh_token) {
    response.cookies.set("google_refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
  }

  return response;
}
