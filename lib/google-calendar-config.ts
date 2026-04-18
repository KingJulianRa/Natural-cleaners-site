export function getGoogleCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}
