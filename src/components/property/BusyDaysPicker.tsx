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

type BusyDaysPickerProps = {
  blockedDates: string[];
  bookedRanges?: OccupiedRange[];
  onChange: (dates: string[]) => void;
};

function isBookedDay(iso: string, ranges: OccupiedRange[]): boolean {
  return ranges.some((range) => {
    if ((range.source || "booking") === "blocked") return false;
    return iso >= range.check_in && iso < range.check_out;
  });
}

export function BusyDaysPicker({
  blockedDates,
  bookedRanges = [],
  onChange,
}: BusyDaysPickerProps) {
  const todayIso = useMemo(() => toIso(new Date()), []);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{
      day: number | null;
      iso?: string;
      booked?: boolean;
      blocked?: boolean;
      isPast?: boolean;
      isToday?: boolean;
    }> = [];

    for (let i = 0; i < firstWeekday; i++) list.push({ day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      const iso = toIso(new Date(year, month, day));
      list.push({
        day,
        iso,
        booked: isBookedDay(iso, bookedRanges),
        blocked: blockedSet.has(iso),
        isPast: iso < todayIso,
        isToday: iso === todayIso,
      });
    }
    while (list.length % 7 !== 0) list.push({ day: null });
    return list;
  }, [blockedSet, bookedRanges, cursor, todayIso]);

  function toggleDay(iso: string, booked: boolean) {
    if (booked) return;
    if (blockedSet.has(iso)) {
      onChange(blockedDates.filter((d) => d !== iso));
    } else {
      onChange([...blockedDates, iso].sort());
    }
  }

  return (
    <div className="busy-days-picker">
      <div className="busy-days-picker-toolbar">
        <button
          type="button"
          className="busy-days-nav-btn"
          aria-label="Əvvəlki ay"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          ←
        </button>
        <span>{monthLabel(cursor)}</span>
        <button
          type="button"
          className="busy-days-nav-btn"
          aria-label="Növbəti ay"
          onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          →
        </button>
      </div>

      <div className="busy-days-legend">
        <span className="busy-days-legend-item">
          <i className="busy-dot busy-dot--blocked" /> Sahib tərəfindən dolu
        </span>
        <span className="busy-days-legend-item">
          <i className="busy-dot busy-dot--booked" /> Rezerv olunub
        </span>
        <span className="busy-days-legend-item">
          <i className="busy-dot busy-dot--free" /> Boş
        </span>
      </div>

      <div className="busy-days-month">
        <div className="busy-days-weekdays">
          {WEEKDAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="busy-days-grid">
          {cells.map((cell, idx) =>
            cell.day == null ? (
              <span key={`e-${idx}`} className="busy-day is-empty" aria-hidden="true" />
            ) : (
              <button
                key={cell.iso}
                type="button"
                className={[
                  "busy-day",
                  cell.booked ? "is-booked" : "",
                  cell.blocked ? "is-blocked" : "",
                  cell.isPast ? "is-past" : "",
                  cell.isToday ? "is-today" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                disabled={cell.booked}
                onClick={() => cell.iso && toggleDay(cell.iso, Boolean(cell.booked))}
                title={
                  cell.booked
                    ? "Rezerv olunub"
                    : cell.blocked
                      ? "Dolu günü sil"
                      : "Dolu gün kimi seç"
                }
              >
                <span className="busy-day-num">{cell.day}</span>
                <span className="busy-day-mark" aria-hidden="true" />
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
