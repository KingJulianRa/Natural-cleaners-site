"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";

function getDurationFromPrice(price: number) {
  return Math.ceil(price / 150);
}

function formatMonthTitle(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatDayNumber(date: Date) {
  return date.getDate();
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthParam(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function formatHumanDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildMonthGrid(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const startDayOfWeek = firstDay.getDay();
  const gridStart = new Date(year, month, 1 - startDayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  return days;
}

function buildWeeks(days: Date[]) {
  const weeks: Date[][] = [];

  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return weeks;
}

function isSameDay(a: Date, b: Date | null) {
  if (!b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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

function buildLocalDateTime(date: Date, hour: number, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function formatTimeLabel(hour: number, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

type BusyBlock = {
  start: string;
  end: string;
};

type TimeOption = {
  label: string;
  start: string;
  end: string;
};

function overlaps(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && endA > startB;
}

function slotConflicts(start: Date, end: Date, busyBlocks: BusyBlock[]) {
  return busyBlocks.some((busy) => {
    const busyStart = new Date(busy.start);
    const busyEnd = new Date(busy.end);
    return overlaps(start, end, busyStart, busyEnd);
  });
}

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getNextHalfHour(date: Date) {
  const next = new Date(date);

  if (next.getSeconds() !== 0 || next.getMilliseconds() !== 0) {
    next.setSeconds(0, 0);
    next.setMinutes(next.getMinutes() + 1);
  }

  const remainder = next.getMinutes() % 30;

  if (remainder !== 0) {
    next.setMinutes(next.getMinutes() + (30 - remainder), 0, 0);
  }

  return next;
}

function getAvailableStartTimes(
  date: Date,
  price: number,
  busyBlocks: BusyBlock[]
): TimeOption[] {
  if (isWeekend(date)) return [];

  const now = new Date();
  const sameDayAsNow = isSameCalendarDay(date, now);
  const earliestStart = sameDayAsNow ? getNextHalfHour(now) : null;
  const durationHours = getDurationFromPrice(price);

  if (durationHours > 10) {
    const fullDaysNeeded = Math.ceil(durationHours / 10);

    let currentDay = new Date(date);
    currentDay.setHours(7, 0, 0, 0);

    if (currentDay < now) return [];

    for (let i = 0; i < fullDaysNeeded; i++) {
      const dayStart = new Date(currentDay);
      dayStart.setHours(7, 0, 0, 0);

      const dayEnd = new Date(currentDay);
      dayEnd.setHours(17, 0, 0, 0);

      const isBusy = slotConflicts(dayStart, dayEnd, busyBlocks);
      if (isBusy) return [];

      if (i < fullDaysNeeded - 1) {
        currentDay = getNextWorkingDay(currentDay);
      }
    }

    const finalEnd = new Date(currentDay);
    finalEnd.setHours(17, 0, 0, 0);

    return [
      {
        label: "7:00 AM",
        start: buildLocalDateTime(date, 7).toISOString(),
        end: finalEnd.toISOString(),
      },
    ];
  }

  const options: TimeOption[] = [];
  const lastPossibleStart = buildLocalDateTime(date, 17 - durationHours);

  for (let hour = 7; hour < 17; hour++) {
    for (const minute of [0, 30]) {
      const start = buildLocalDateTime(date, hour, minute);

      if (start > lastPossibleStart) {
        continue;
      }

      const end = new Date(start);
      end.setHours(end.getHours() + durationHours);

      if (earliestStart && start < earliestStart) continue;
      if (slotConflicts(start, end, busyBlocks)) continue;

      options.push({
        label: formatTimeLabel(hour, minute),
        start: start.toISOString(),
        end: end.toISOString(),
      });
    }
  }

  return options;
}

export default function SchedulePage() {
  const [price, setPrice] = useState(300);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<TimeOption | null>(null);
  const [busyBlocks, setBusyBlocks] = useState<BusyBlock[]>([]);
  const [loadingBusyBlocks, setLoadingBusyBlocks] = useState(true);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [notConnected, setNotConnected] = useState(false);
  const [isCompactCalendar, setIsCompactCalendar] = useState(false);
  const [weekIndex, setWeekIndex] = useState(0);
  const [pendingWeekBoundary, setPendingWeekBoundary] = useState<
    "start" | "end" | null
  >(null);
  const [serviceLevel, setServiceLevel] = useState("");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const priceParam = searchParams.get("price");
    const serviceLevelParam = searchParams.get("serviceLevel");
    const nextPrice = priceParam ? Number(priceParam) : 300;
    setPrice(Number.isFinite(nextPrice) ? nextPrice : 300);
    setServiceLevel(serviceLevelParam?.trim() || "");
  }, []);

  useEffect(() => {
    function syncViewportMode() {
      setIsCompactCalendar(window.innerWidth < 640);
    }

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);

    return () => {
      window.removeEventListener("resize", syncViewportMode);
    };
  }, []);

  const days = useMemo(() => buildMonthGrid(currentMonth), [currentMonth]);
  const weeks = useMemo(() => buildWeeks(days), [days]);

  useEffect(() => {
    if (!isCompactCalendar) return;

    if (pendingWeekBoundary) {
      setWeekIndex(pendingWeekBoundary === "end" ? weeks.length - 1 : 0);
      setPendingWeekBoundary(null);
      return;
    }

    if (
      selectedDate &&
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth()
    ) {
      const selectedWeekIndex = weeks.findIndex((week) =>
        week.some((day) => isSameDay(day, selectedDate))
      );

      if (selectedWeekIndex >= 0) {
        setWeekIndex(selectedWeekIndex);
        return;
      }
    }

    const firstVisibleWeekIndex = weeks.findIndex((week) =>
      week.some((day) => day.getMonth() === currentMonth.getMonth())
    );

    const now = new Date();
    const todayOnly = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const todayInCurrentMonth =
      todayOnly.getFullYear() === currentMonth.getFullYear() &&
      todayOnly.getMonth() === currentMonth.getMonth();

    if (todayInCurrentMonth) {
      const currentWeekIndex = weeks.findIndex((week) =>
        week.some((day) => isSameDay(day, todayOnly))
      );

      if (currentWeekIndex >= 0) {
        setWeekIndex(currentWeekIndex);
        return;
      }
    }

    setWeekIndex(firstVisibleWeekIndex >= 0 ? firstVisibleWeekIndex : 0);
  }, [currentMonth, isCompactCalendar, pendingWeekBoundary, selectedDate, weeks]);

  const visibleDays = useMemo(() => {
    if (!isCompactCalendar) return days;
    return weeks[weekIndex] ?? weeks[0] ?? [];
  }, [days, isCompactCalendar, weekIndex, weeks]);

  useEffect(() => {
    let cancelled = false;

    async function loadBusyBlocks() {
      try {
        setLoadingBusyBlocks(true);
        setCalendarError(null);
        setNotConnected(false);

        const month = formatMonthParam(currentMonth);
        const res = await fetch(`/api/busy-blocks?month=${month}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to fetch busy blocks");
        }

        if (!cancelled) {
          setBusyBlocks(data.busyBlocks || []);
          setNotConnected(Boolean(data.notConnected));
        }
      } catch (error) {
        if (!cancelled) {
          setCalendarError(
            error instanceof Error ? error.message : "Failed to load calendar"
          );
          setBusyBlocks([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingBusyBlocks(false);
        }
      }
    }

    loadBusyBlocks();

    return () => {
      cancelled = true;
    };
  }, [currentMonth]);

  const selectedTimes = useMemo(() => {
    if (!selectedDate) return [];
    return getAvailableStartTimes(selectedDate, price, busyBlocks);
  }, [selectedDate, price, busyBlocks]);

  const today = new Date();
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  function handleDateClick(day: Date) {
    setSelectedDate(day);
    setSelectedTime(null);
  }

  function handlePreviousPeriod() {
    if (!isCompactCalendar) {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
      );
      return;
    }

    if (weekIndex > 0) {
      setWeekIndex(weekIndex - 1);
      return;
    }

    setPendingWeekBoundary("end");
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  }

  function handleNextPeriod() {
    if (!isCompactCalendar) {
      setCurrentMonth(
        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      );
      return;
    }

    if (weekIndex < weeks.length - 1) {
      setWeekIndex(weekIndex + 1);
      return;
    }

    setPendingWeekBoundary("start");
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  }

  const estimatedHours = Math.ceil(price / 150);

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
          maxWidth: 1250,
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginBottom: 20,
            color: "#0f766e",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to Quote
        </Link>

        <div
          style={{
            background: "white",
            borderRadius: 20,
            padding: 24,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          }}
        >
          <h1 style={{ marginTop: 0, fontSize: 36 }}>Schedule an Appointment</h1>
          <p style={{ color: "#4b5563", lineHeight: 1.6 }}>
            Click a day, then choose a start time.
          </p>

          <div
            style={{
              marginTop: 12,
              marginBottom: 24,
              padding: 14,
              borderRadius: 12,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              fontWeight: 600,
              textAlign: "center",
            }}
          >
            Estimated job time: {estimatedHours} hour{estimatedHours === 1 ? "" : "s"}
          </div>

          {loadingBusyBlocks && (
            <div style={statusBoxStyle}>
              Loading calendar availability...
            </div>
          )}

          {calendarError && (
            <div style={{ ...statusBoxStyle, background: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}>
              {calendarError}
            </div>
          )}

          {notConnected && !loadingBusyBlocks && !calendarError && (
            <div style={{ ...statusBoxStyle, background: "#fff7ed", borderColor: "#fdba74", color: "#9a3412" }}>
              Google Calendar is not connected yet. Visit <strong>/api/auth/google</strong> first.
            </div>
          )}

          <div
            style={{
              display: selectedDate ? "grid" : "block",
              gridTemplateColumns: selectedDate
                ? isCompactCalendar
                  ? "1fr"
                  : "minmax(0, 1.5fr) minmax(min(320px, 100%), 1fr)"
                : undefined,
              gap: 24,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 18,
                padding: 18,
                background: "#fcfcfc",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <button
                  onClick={handlePreviousPeriod}
                  style={isCompactCalendar ? compactNavButtonStyle : navButtonStyle}
                >
                  ← Prev
                </button>

                <h2 style={{ margin: 0 }}>{formatMonthTitle(currentMonth)}</h2>

                <button
                  onClick={handleNextPeriod}
                  style={isCompactCalendar ? compactNavButtonStyle : navButtonStyle}
                >
                  Next →
                </button>
              </div>

              {isCompactCalendar && (
                <div
                  style={{
                    marginBottom: 12,
                    color: "#475569",
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "center",
                  }}
                >
                  Weekly view
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: isCompactCalendar ? 4 : 8,
                  marginBottom: 8,
                }}
              >
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: "center",
                      fontWeight: 700,
                      padding: isCompactCalendar ? "4px 0" : "8px 0",
                      fontSize: isCompactCalendar ? 11 : 14,
                      color: "#475569",
                    }}
                  >
                    {isCompactCalendar ? day.slice(0, 1) : day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, 1fr)",
                  gap: isCompactCalendar ? 4 : 8,
                }}
              >
                {visibleDays.map((day) => {
                  const inCurrentMonth =
                    day.getMonth() === currentMonth.getMonth();

                  const dayOnly = new Date(
                    day.getFullYear(),
                    day.getMonth(),
                    day.getDate()
                  );

                  const pastDay = dayOnly < todayOnly;
                  const disabled = !inCurrentMonth || isWeekend(day) || pastDay;

                  const availableTimes = !disabled
                    ? getAvailableStartTimes(day, price, busyBlocks)
                    : [];

                  const hasAvailability = availableTimes.length > 0;

                  let background = "white";
                  let border = "1px solid #d1d5db";
                  let boxShadow = "none";

                  if (disabled) {
                    background = "#f8fafc";
                  } else if (isSameDay(day, selectedDate)) {
                    background = "#d1fae5";
                    border = "1px solid #0f766e";
                    boxShadow = "inset 0 0 0 1px #0f766e";
                  } else if (hasAvailability) {
                    background = "#dcfce7";
                    border = "1px solid #86efac";
                  } else {
                    background = "#fee2e2";
                    border = "1px solid #fca5a5";
                  }

                  return (
                    <button
                      key={formatDateKey(day)}
                      onClick={() => !disabled && handleDateClick(day)}
                      disabled={disabled}
                      style={{
                        width: "100%",
                        minWidth: 0,
                        minHeight: isCompactCalendar ? undefined : 90,
                        aspectRatio: isCompactCalendar ? "1 / 1" : undefined,
                        borderRadius: isCompactCalendar ? 10 : 14,
                        border,
                        boxShadow,
                        boxSizing: "border-box",
                        background,
                        color: inCurrentMonth ? "#111827" : "#94a3b8",
                        cursor: disabled ? "not-allowed" : "pointer",
                        textAlign: isCompactCalendar ? "center" : "left",
                        padding: isCompactCalendar ? 0 : 12,
                        opacity: disabled ? 0.55 : 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: isCompactCalendar ? "center" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: isCompactCalendar ? 14 : 16,
                          display: "block",
                          width: isCompactCalendar ? "auto" : "auto",
                          textAlign: "center",
                          fontVariantNumeric: "tabular-nums",
                          margin: 0,
                        }}
                      >
                        {formatDayNumber(day)}
                      </div>

                      {!disabled && !isCompactCalendar && (
                        <div
                          style={{
                            marginTop: isCompactCalendar ? 6 : 8,
                            fontSize: isCompactCalendar ? 10 : 12,
                            fontWeight: 600,
                            color: hasAvailability ? "#166534" : "#991b1b",
                          }}
                        >
                          {hasAvailability ? "Available" : "Unavailable"}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 18,
                  padding: 20,
                  background: "#f8fafc",
                  minHeight: 300,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  textAlign: "center",
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: 8 }}>
                  {formatHumanDate(selectedDate)}
                </h3>

                {selectedTimes.length === 0 && (
                  <p style={{ color: "#4b5563", lineHeight: 1.6, maxWidth: 320 }}>
                    No times available for this day.
                  </p>
                )}

                {selectedTimes.length > 0 && (
                  <>
                    <p
                      style={{
                        color: "#4b5563",
                        marginTop: 0,
                        marginBottom: 12,
                        maxWidth: 320,
                      }}
                    >
                      Choose a start time:
                    </p>

                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 12,
                        justifyContent: "center",
                        maxWidth: 252,
                      }}
                    >
                      {selectedTimes.map((time) => {
                        const isSelected = selectedTime?.start === time.start;

                        return (
                          <button
                            key={time.start}
                            onClick={() => setSelectedTime(time)}
                            style={{
                              width: 120,
                              padding: "14px 12px",
                              borderRadius: 12,
                              border: isSelected
                                ? "2px solid #0f766e"
                                : "1px solid #d1d5db",
                              background: isSelected ? "#d1fae5" : "white",
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.2s ease",
                              boxShadow: isSelected
                                ? "0 4px 12px rgba(15, 118, 110, 0.15)"
                                : "none",
                            }}
                          >
                            {time.label}
                          </button>
                        );
                      })}
                    </div>

                    {selectedTime && (
                      <div
                        style={{
                          marginTop: 20,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#0f172a",
                          }}
                        >
                          Selected time: {selectedTime.label}
                        </div>

                        <Link
                          href={`/schedule/details?price=${encodeURIComponent(
                            String(price)
                          )}&slotLabel=${encodeURIComponent(
                            selectedTime.label
                          )}&slotStart=${encodeURIComponent(
                            selectedTime.start
                          )}&slotEnd=${encodeURIComponent(selectedTime.end)}&serviceLevel=${encodeURIComponent(serviceLevel)}`}
                          style={continueButtonStyle}
                        >
                          Continue
                        </Link>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

const navButtonStyle: React.CSSProperties = {
  background: "white",
  border: "1px solid #d1d5db",
  padding: "10px 14px",
  borderRadius: 12,
  cursor: "pointer",
  fontWeight: 600,
};

const compactNavButtonStyle: React.CSSProperties = {
  ...navButtonStyle,
  padding: "6px 10px",
  borderRadius: 10,
  fontSize: 12,
};

const continueButtonStyle: React.CSSProperties = {
  background: "#0f766e",
  color: "white",
  padding: "12px 22px",
  borderRadius: 12,
  display: "inline-block",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
  transition: "all 0.2s ease",
};

const statusBoxStyle: React.CSSProperties = {
  marginBottom: 20,
  padding: 12,
  borderRadius: 12,
  background: "#eff6ff",
  border: "1px solid #bfdbfe",
  color: "#1d4ed8",
  fontWeight: 600,
};
