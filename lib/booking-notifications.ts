import { Resend } from "resend";

import type { BookingRecord } from "@/lib/bookings";

export type BookingNotificationResult = {
  sent: boolean;
  skipped: boolean;
  reason?: string;
  id?: string | null;
};

export type BookingNotificationSummary = {
  admin: BookingNotificationResult;
  customer: BookingNotificationResult;
};

function getNotificationRecipients() {
  return (process.env.BOOKING_NOTIFICATION_TO || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function formatBookingTime(slotStart: string, slotEnd: string) {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);

  return `${start.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
  })} to ${end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
  })}`;
}

export async function sendBookingNotification(
  booking: BookingRecord
): Promise<BookingNotificationSummary> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipients = getNotificationRecipients();
  const from = process.env.BOOKING_NOTIFICATION_FROM;

  if (!apiKey) {
    return {
      admin: {
        sent: false,
        skipped: true,
        reason: "RESEND_API_KEY is not configured.",
      },
      customer: {
        sent: false,
        skipped: true,
        reason: "RESEND_API_KEY is not configured.",
      },
    };
  }

  if (!from) {
    return {
      admin: {
        sent: false,
        skipped: true,
        reason: "BOOKING_NOTIFICATION_FROM is not configured.",
      },
      customer: {
        sent: false,
        skipped: true,
        reason: "BOOKING_NOTIFICATION_FROM is not configured.",
      },
    };
  }

  if (recipients.length === 0) {
    return {
      admin: {
        sent: false,
        skipped: true,
        reason: "BOOKING_NOTIFICATION_TO is not configured.",
      },
      customer: {
        sent: false,
        skipped: true,
        reason: "BOOKING_NOTIFICATION_TO is not configured.",
      },
    };
  }

  const resend = new Resend(apiKey);
  const formattedTime = formatBookingTime(booking.slotStart, booking.slotEnd);

  const { data: adminData, error: adminError } = await resend.emails.send({
    from,
    to: recipients,
    replyTo: booking.email,
    subject: `New Natural Cleaners booking for ${booking.name}`,
    text: [
      "A new booking was scheduled.",
      "",
      `Name: ${booking.name}`,
      `Address: ${booking.address}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email}`,
      `Quoted price: $${booking.price.toFixed(2)}`,
      `Appointment: ${formattedTime}`,
      `Slot label: ${booking.slotLabel}`,
      `Booking ID: ${booking.id}`,
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>New booking scheduled</h2>
        <p><strong>Name:</strong> ${booking.name}</p>
        <p><strong>Address:</strong> ${booking.address}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p><strong>Email:</strong> ${booking.email}</p>
        <p><strong>Quoted price:</strong> $${booking.price.toFixed(2)}</p>
        <p><strong>Appointment:</strong> ${formattedTime}</p>
        <p><strong>Slot label:</strong> ${booking.slotLabel}</p>
        <p><strong>Booking ID:</strong> ${booking.id}</p>
      </div>
    `,
  });

  const admin: BookingNotificationResult = adminError
    ? {
        sent: false,
        skipped: false,
        reason: adminError.message,
      }
    : {
        sent: true,
        skipped: false,
        id: adminData?.id ?? null,
      };

  const { data: customerData, error: customerError } = await resend.emails.send({
    from,
    to: booking.email,
    subject: "Thank you for scheduling an appointment with Natural Cleaners",
    text: [
      "Thank you for scheduling an appointment with Natural Cleaners.",
      "",
      "Here are the details:",
      `Appointment: ${formattedTime}`,
      `Quoted price: $${booking.price.toFixed(2)}`,
      `Address: ${booking.address}`,
      `Phone: ${booking.phone}`,
      "",
      "If you need to make any changes, please reply to this email.",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #111827;">
        <h2>Thank you for scheduling an appointment with Natural Cleaners</h2>
        <p>Here are the details:</p>
        <p><strong>Appointment:</strong> ${formattedTime}</p>
        <p><strong>Quoted price:</strong> $${booking.price.toFixed(2)}</p>
        <p><strong>Address:</strong> ${booking.address}</p>
        <p><strong>Phone:</strong> ${booking.phone}</p>
        <p>If you need to make any changes, please reply to this email.</p>
      </div>
    `,
  });

  const customer: BookingNotificationResult = customerError
    ? {
        sent: false,
        skipped: false,
        reason: customerError.message,
      }
    : {
        sent: true,
        skipped: false,
        id: customerData?.id ?? null,
      };

  return {
    admin,
    customer,
  };
}
