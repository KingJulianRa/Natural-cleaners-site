import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

type TimeSlot = {
  start: string;
  end: string;
  label: string;
};

function formatSlotLabel(startIso: string) {
  const date = new Date(startIso);

  return date.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
  });
}

function overlaps(slotStart: Date, slotEnd: Date, busyStart: Date, busyEnd: Date) {
  return slotStart < busyEnd && slotEnd > busyStart;
}

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("google_access_token")?.value;
  const refreshToken = request.cookies.get("google_refresh_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ slots: [], error: "Not connected to Google yet" }, { status: 200 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    "http://localhost:3000/api/auth/callback"
  );

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const now = new Date();
  const end = new Date();
  end.setDate(end.getDate() + 14);

  const freeBusyResponse = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      timeZone: "America/Phoenix",
      items: [{ id: "primary" }],
    },
  });

  const busyTimes = freeBusyResponse.data.calendars?.primary?.busy ?? [];

  const slots: TimeSlot[] = [];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const base = new Date();
    base.setDate(base.getDate() + dayOffset);

    const weekday = base.getDay();

    if (weekday === 0 || weekday === 6) {
      continue;
    }

    const slotHours = [9, 11, 13, 15];

    for (const hour of slotHours) {
      const slotStart = new Date(base);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(base);
      slotEnd.setHours(hour + 2, 0, 0, 0);

      if (slotStart < now) {
        continue;
      }

      const isBusy = busyTimes.some((busy) => {
        if (!busy.start || !busy.end) return false;
        return overlaps(
          slotStart,
          slotEnd,
          new Date(busy.start),
          new Date(busy.end)
        );
      });

      if (!isBusy) {
        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          label: formatSlotLabel(slotStart.toISOString()),
        });
      }
    }
  }

  return NextResponse.json({ slots });
}