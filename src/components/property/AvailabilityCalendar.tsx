"use client";

import { useMemo, useState } from "react";

const WEEKDAYS = ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"];

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function monthLabel(date: Date): string {
  return new Intl.DateTimeFormat("az-AZ", { month: "long", year: "numeric" }).format(date);
}

type OccupiedRange = {
  check_in: string;
  check_out: string;
  source?: string;
};

type AvailabilityCalendarProps = {
  occupiedRanges?: OccupiedRange[];
  months?: number;
};

function dayStatus(iso: string, ranges: OccupiedRange[]): "booked" | "blocked" | "free" {
  for (const range of ranges) {
    if (iso >= range.check_in && iso < range.check_out) {
      return (range.source || "booking") === "blocked" ? "blocked" : "booked";
    }
  }
  return "free";
}

export function AvailabilityCalendar({
  occupiedRanges = [],
  months = 3,
}: AvailabilityCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const monthDates = useMemo(() => {
    const list: Date[] = [];
    for (let i = 0; i < months; i++) {
      list.push(new Date(cursor.getFullYear(), cursor.getMonth() + i, 1));
    }
    return list;
  }, [cursor, months]);

  function buildCells(monthDate: Date) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; iso?: string; status?: string }> = [];

    for (let i = 0; i < firstWeekday; i++) cells.push({ day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIso(new Date(year, month, day));
      cells.push({ day, iso, status: dayStatus(iso, occupiedRanges) });
    }
    while (cells.length % 7 !== 0) cells.push({ day: null });
    return cells;
  }

  return (
    <div className="busy-days-picker availability-calendar">
      <div className="busy-days-picker-toolbar">
        <button
          type="button"
          className="auth-btn"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          ←
        </button>
        <span>{monthLabel(cursor)}</span>
        <button
          type="button"
          className="auth-btn"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          →
        </button>
      </div>

      <div className="busy-days-legend">
        <span className="busy-days-legend-item">
          <i className="busy-dot busy-dot--booked" /> Rezerv olunub
        </span>
        <span className="busy-days-legend-item">
          <i className="busy-dot busy-dot--blocked" /> Sahib bağlayıb
        </span>
        <span className="busy-days-legend-item">
          <i className="busy-dot busy-dot--free" /> Boş
        </span>
      </div>

      <div className="busy-days-months">
        {monthDates.map((monthDate) => {
          const cells = buildCells(monthDate);
          return (
            <div key={monthDate.toISOString()} className="busy-days-month">
              <h4>{monthLabel(monthDate)}</h4>
              <div className="busy-days-weekdays">
                {WEEKDAYS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="busy-days-grid">
                {cells.map((cell, idx) =>
                  cell.day == null ? (
                    <span key={`e-${idx}`} className="busy-day is-empty" />
                  ) : (
                    <span
                      key={cell.iso}
                      className={[
                        "busy-day",
                        "is-readonly",
                        cell.status === "booked" ? "is-booked" : "",
                        cell.status === "blocked" ? "is-blocked" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      title={
                        cell.status === "booked"
                          ? "Rezerv olunub"
                          : cell.status === "blocked"
                            ? "Sahib bağlayıb"
                            : "Boş"
                      }
                    >
                      {cell.day}
                    </span>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
