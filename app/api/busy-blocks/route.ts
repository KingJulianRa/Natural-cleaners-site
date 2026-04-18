import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleCalendarId } from "@/lib/google-calendar-config";
import { getGoogleRedirectUri } from "@/lib/google-oauth";
import { getStoredGoogleTokens } from "@/lib/google-token-store";

export async function GET(request: NextRequest) {
  try {
    const cookieAccessToken = request.cookies.get("google_access_token")?.value;
    const cookieRefreshToken = request.cookies.get("google_refresh_token")?.value;
    const storedTokens = await getStoredGoogleTokens();
    const accessToken = cookieAccessToken || storedTokens?.accessToken || "";
    const refreshToken = cookieRefreshToken || storedTokens?.refreshToken || "";

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ busyBlocks: [], notConnected: true });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get("month"); // YYYY-MM

    if (!monthParam || !/^\d{4}-\d{2}$/.test(monthParam)) {
      return NextResponse.json(
        { error: "Missing or invalid month query param. Use YYYY-MM." },
        { status: 400 }
      );
    }

    const [yearStr, monthStr] = monthParam.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;

    const timeMin = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const timeMax = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      getGoogleRedirectUri()
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });
    const calendarId = getGoogleCalendarId();

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        timeZone: "America/Phoenix",
        items: [{ id: calendarId }],
      },
    });

    const busyBlocks =
      response.data.calendars?.[calendarId]?.busy?.map((block) => ({
        start: block.start || "",
        end: block.end || "",
      })) ?? [];

    return NextResponse.json({ busyBlocks });
  } catch (error) {
    console.error("busy-blocks error:", error);
    return NextResponse.json(
      { error: "Failed to load Google Calendar availability." },
      { status: 500 }
    );
  }
}
