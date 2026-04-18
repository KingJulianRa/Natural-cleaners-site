import { google } from "googleapis";

import type { BookingRecord } from "@/lib/bookings";
import { getGoogleCalendarId } from "@/lib/google-calendar-config";
import { getGoogleRedirectUri } from "@/lib/google-oauth";

export type BookingCalendarResult = {
  created: boolean;
  skipped: boolean;
  reason?: string;
  eventId?: string | null;
};

type CalendarTokens = {
  accessToken?: string;
  refreshToken?: string;
};

function isWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function getNextWorkingDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getDurationFromPrice(price: number) {
  return Math.ceil(price / 150);
}

function buildEventDescription(booking: BookingRecord) {
  return [
    `Client: ${booking.name}`,
    `Phone: ${booking.phone}`,
    `Email: ${booking.email}`,
    `Address: ${booking.address}`,
    `Quoted price: $${booking.price.toFixed(2)}`,
    `Service: ${booking.serviceLevel}`,
    `Slot label: ${booking.slotLabel}`,
    `Booking ID: ${booking.id}`,
  ].join("\n");
}

function buildCalendarEventSegments(booking: BookingRecord) {
  const durationHours = getDurationFromPrice(booking.price);

  if (durationHours <= 10) {
    return [
      {
        start: new Date(booking.slotStart),
        end: new Date(booking.slotEnd),
        suffix: "",
      },
    ];
  }

  const segments: Array<{ start: Date; end: Date; suffix: string }> = [];
  let remainingHours = durationHours;
  let currentDay = new Date(booking.slotStart);
  currentDay.setHours(7, 0, 0, 0);
  let dayNumber = 1;

  while (remainingHours > 0) {
    const start = new Date(currentDay);
    start.setHours(7, 0, 0, 0);

    const hoursForDay = Math.min(remainingHours, 10);
    const end = new Date(start);
    end.setHours(end.getHours() + hoursForDay);

    segments.push({
      start,
      end,
      suffix: ` (Day ${dayNumber})`,
    });

    remainingHours -= hoursForDay;
    dayNumber += 1;

    if (remainingHours > 0) {
      currentDay = getNextWorkingDay(currentDay);
    }
  }

  return segments;
}

export async function createBookingCalendarEvent(
  booking: BookingRecord,
  tokens: CalendarTokens
): Promise<BookingCalendarResult> {
  if (!tokens.accessToken && !tokens.refreshToken) {
    return {
      created: false,
      skipped: true,
      reason: "Google Calendar is not connected.",
    };
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return {
      created: false,
      skipped: true,
      reason: "Google Calendar OAuth credentials are not configured.",
    };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      getGoogleRedirectUri()
    );

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });
    const calendarId = getGoogleCalendarId();
    const segments = buildCalendarEventSegments(booking);
    const eventIds: string[] = [];

    for (const segment of segments) {
      const response = await calendar.events.insert({
        calendarId,
        sendUpdates: "none",
        requestBody: {
          summary: `Online Booking: ${booking.name}${segment.suffix}`,
          description: buildEventDescription(booking),
          start: {
            dateTime: segment.start.toISOString(),
            timeZone: "America/Phoenix",
          },
          end: {
            dateTime: segment.end.toISOString(),
            timeZone: "America/Phoenix",
          },
          status: "confirmed",
          transparency: "opaque",
        },
      });

      if (response.data.id) {
        eventIds.push(response.data.id);
      }
    }

    return {
      created: true,
      skipped: false,
      eventId: eventIds[0] ?? null,
    };
  } catch (error) {
    return {
      created: false,
      skipped: false,
      reason: error instanceof Error ? error.message : "Failed to create calendar event.",
    };
  }
}
