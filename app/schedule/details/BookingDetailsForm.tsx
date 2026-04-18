"use client";

import Link from "next/link";
import React, { useState } from "react";
import SiteHeader from "../../components/SiteHeader";

type BookingDraft = {
  price: number;
  slotLabel: string;
  slotStart: string;
  slotEnd: string;
  serviceLevel: string;
};

type FormState = {
  name: string;
  address: string;
  phone: string;
  email: string;
};

const PHONE_PATTERN = "^(?:\\+?1\\s*)?(?:\\([0-9]{3}\\)|[0-9]{3})[-.\\s]?[0-9]{3}[-.\\s]?[0-9]{4}$";
const PHONE_REGEX = /^(?:\+?1\s*)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

function formatFullSlot(slotStart: string, slotEnd: string) {
  const start = new Date(slotStart);
  const end = new Date(slotEnd);

  return `${start.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
  })} to ${end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Phoenix",
  })}`;
}

export default function BookingDetailsForm({
  draft,
  missingServiceLevel = false,
}: {
  draft: BookingDraft | null;
  missingServiceLevel?: boolean;
}) {
  const [form, setForm] = useState<FormState>({
    name: "",
    address: "",
    phone: "",
    email: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft) {
      setStatus("error");
      setMessage(
        missingServiceLevel
          ? "Please go back to the Quote Estimator, choose a level of service, and then select the appointment time again."
          : "Please go back and choose a time slot again."
      );
      return;
    }

    if (!PHONE_REGEX.test(form.phone.trim())) {
      setStatus("error");
      setMessage("Please enter a valid phone number before saving.");
      return;
    }

    setStatus("saving");
    setMessage("");

    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...form,
        ...draft,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(data?.error || "We couldn't save your booking.");
      return;
    }

    const warnings: string[] = [];

    if (data?.calendar && !data.calendar.created) {
      warnings.push(
        data.calendar.reason
          ? `The Google Calendar event was not created yet: ${data.calendar.reason}`
          : "The Google Calendar event was not created yet."
      );
    }

    if (data?.notification?.admin && !data.notification.admin.sent) {
      warnings.push(
        data.notification.admin.reason
          ? `The internal notification email did not send: ${data.notification.admin.reason}`
          : "The internal notification email did not send."
      );
    }

    if (data?.notification?.customer && !data.notification.customer.sent) {
      warnings.push(
        data.notification.customer.reason
          ? `The customer confirmation email did not send: ${data.notification.customer.reason}`
          : "The customer confirmation email did not send."
      );
    }

    setStatus("success");
    setMessage(
      warnings.length > 0
        ? `Booking saved successfully, but there were follow-up issues: ${warnings.join(" ")}`
        : "Booking saved successfully. Confirmation emails were sent and the time was added to Google Calendar."
    );
    setForm({
      name: "",
      address: "",
      phone: "",
      email: "",
    });
  }

  return (
    <main
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#f7f7f2",
        minHeight: "100vh",
        color: "#1f2937",
      }}
    >
      <SiteHeader />

      <section
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <Link
          href="/schedule"
          style={{
            display: "inline-block",
            marginBottom: 20,
            color: "#0f766e",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to Schedule
        </Link>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: 28,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 36 }}>Booking Details</h1>
          <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
            Enter the client details below and we&apos;ll save this appointment request into your records.
          </p>

          {draft ? (
            <div
              style={{
                marginTop: 18,
                marginBottom: 24,
                padding: 16,
                borderRadius: 14,
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Appointment Summary</div>
              <div style={{ color: "#0f172a", lineHeight: 1.6 }}>
                <div>{formatFullSlot(draft.slotStart, draft.slotEnd)}</div>
                <div>Quoted price: {formatCurrency(draft.price)}</div>
                {draft.serviceLevel && <div>Service: {draft.serviceLevel}</div>}
              </div>
            </div>
          ) : (
            <div style={messageBoxStyle}>
              {missingServiceLevel
                ? "We couldn&apos;t find the service level for this booking. Please go back to the Quote Estimator, choose a level of service, and then select the appointment time again."
                : "We couldn&apos;t find the selected appointment details. Please go back and choose a time again."}
            </div>
          )}

          {draft && (
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <label style={labelStyle}>
                Name
                <input
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Address
                <input
                  required
                  value={form.address}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Phone Number
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  pattern={PHONE_PATTERN}
                  title="Enter a valid phone number in the format xxx-xxx-xxxx."
                  placeholder="xxx-xxx-xxxx"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Email
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  style={inputStyle}
                />
              </label>

              <button
                type="submit"
                disabled={status === "saving"}
                style={{
                  ...submitButtonStyle,
                  opacity: status === "saving" ? 0.7 : 1,
                }}
              >
                {status === "saving" ? "Saving..." : "Save Booking"}
              </button>
            </form>
          )}

          {message && status !== "idle" && (
            <div
              style={{
                ...messageBoxStyle,
                marginTop: 18,
                background: status === "success" ? "#eff6ff" : "#fef2f2",
                borderColor: status === "success" ? "#bfdbfe" : "#fecaca",
                color: status === "success" ? "#1d4ed8" : "#991b1b",
              }}
            >
              {message}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  fontWeight: 600,
  color: "#0f172a",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  fontSize: 16,
  background: "white",
};

const submitButtonStyle: React.CSSProperties = {
  background: "#0f766e",
  color: "white",
  border: "none",
  padding: "14px 22px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 16,
};

const messageBoxStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  background: "#f8fafc",
  color: "#334155",
  lineHeight: 1.6,
};
