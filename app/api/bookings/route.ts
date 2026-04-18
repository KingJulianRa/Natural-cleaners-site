import { NextRequest, NextResponse } from "next/server";

import { sendBookingNotification } from "@/lib/booking-notifications";
import { createBooking } from "@/lib/bookings";
import { createBookingCalendarEvent } from "@/lib/google-calendar";

export const runtime = "nodejs";

const PHONE_REGEX = /^(?:\+?1\s*)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const address = typeof body.address === "string" ? body.address.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const slotLabel = typeof body.slotLabel === "string" ? body.slotLabel.trim() : "";
    const slotStart = typeof body.slotStart === "string" ? body.slotStart.trim() : "";
    const slotEnd = typeof body.slotEnd === "string" ? body.slotEnd.trim() : "";
    const serviceLevel = typeof body.serviceLevel === "string" ? body.serviceLevel.trim() : "";
    const price = Number(body.price);

    if (!serviceLevel) {
      return NextResponse.json(
        { error: "Please go back to the Quote Estimator and choose a level of service before booking." },
        { status: 400 }
      );
    }

    if (!name || !address || !phone || !email || !slotLabel || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: "Please complete every field before submitting." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price)) {
      return NextResponse.json(
        { error: "The booking price is missing or invalid." },
        { status: 400 }
      );
    }

    if (!PHONE_REGEX.test(phone)) {
      return NextResponse.json(
        { error: "Please enter a valid phone number before submitting." },
        { status: 400 }
      );
    }

    const booking = await createBooking({
      name,
      address,
      phone,
      email,
      price,
      serviceLevel,
      slotLabel,
      slotStart,
      slotEnd,
    });
    const calendar = await createBookingCalendarEvent(booking, {
      accessToken: request.cookies.get("google_access_token")?.value,
      refreshToken: request.cookies.get("google_refresh_token")?.value,
    });
    const notification = await sendBookingNotification(booking);

    if (!calendar.created && !calendar.skipped) {
      console.error("booking calendar event error:", calendar.reason);
    }

    if (!notification.admin.sent && !notification.admin.skipped) {
      console.error("booking admin notification error:", notification.admin.reason);
    }

    if (!notification.customer.sent && !notification.customer.skipped) {
      console.error("booking customer notification error:", notification.customer.reason);
    }

    return NextResponse.json({
      ok: true,
      booking,
      calendar,
      notification,
    });
  } catch (error) {
    console.error("bookings error:", error);
    return NextResponse.json(
      { error: "Something went wrong while saving this booking." },
      { status: 500 }
    );
  }
}
