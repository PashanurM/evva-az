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

type DayStatus = "booked" | "blocked" | "free";

type AvailabilityCalendarProps = {
  occupiedRanges?: OccupiedRange[];
};

function dayStatus(iso: string, ranges: OccupiedRange[]): DayStatus {
  for (const range of ranges) {
    if (iso >= range.check_in && iso < range.check_out) {
      return (range.source || "booking") === "blocked" ? "blocked" : "booked";
    }
  }
  return "free";
}

function statusLabel(status: DayStatus): string {
  if (status === "booked") return "Rezerv olunub";
  if (status === "blocked") return "Sahib bağlayıb";
  return "Boş";
}

export function AvailabilityCalendar({ occupiedRanges = [] }: AvailabilityCalendarProps) {
  const todayIso = useMemo(() => toIso(new Date()), []);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{ day: number | null; iso?: string; status?: DayStatus; isPast?: boolean; isToday?: boolean }> =
      [];

    for (let i = 0; i < firstWeekday; i++) list.push({ day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIso(new Date(year, month, day));
      list.push({
        day,
        iso,
        status: dayStatus(iso, occupiedRanges),
        isPast: iso < todayIso,
        isToday: iso === todayIso,
      });
    }
    while (list.length % 7 !== 0) list.push({ day: null });
    return list;
  }, [cursor, occupiedRanges, todayIso]);

  return (
    <div className="availability-calendar">
      <div className="availability-calendar-nav">
        <button
          type="button"
          className="availability-calendar-nav-btn"
          aria-label="Əvvəlki ay"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          ←
        </button>
        <h3 className="availability-calendar-title">{monthLabel(cursor)}</h3>
        <button
          type="button"
          className="availability-calendar-nav-btn"
          aria-label="Növbəti ay"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          →
        </button>
      </div>

      <div className="availability-calendar-legend">
        <span className="availability-calendar-legend-item">
          <i className="availability-dot is-booked" /> Rezerv olunub
        </span>
        <span className="availability-calendar-legend-item">
          <i className="availability-dot is-blocked" /> Sahib bağlayıb
        </span>
        <span className="availability-calendar-legend-item">
          <i className="availability-dot is-free" /> Boş
        </span>
      </div>

      <div className="availability-calendar-panel">
        <div className="availability-calendar-weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="availability-calendar-grid">
          {cells.map((cell, idx) =>
            cell.day == null ? (
              <span key={`e-${idx}`} className="availability-day is-empty" aria-hidden="true" />
            ) : (
              <span
                key={cell.iso}
                className={[
                  "availability-day",
                  `is-${cell.status}`,
                  cell.isPast ? "is-past" : "",
                  cell.isToday ? "is-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                title={statusLabel(cell.status || "free")}
              >
                <span className="availability-day-num">{cell.day}</span>
                <span className="availability-day-mark" aria-hidden="true" />
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
