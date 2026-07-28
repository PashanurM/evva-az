"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatDateDisplay, formatMonthYear } from "@/lib/date-format";
import { useLocale } from "@/providers/LocaleProvider";

const WEEKDAYS_BY_LOCALE: Record<string, string[]> = {
  az: ["B.e", "Ç.a", "Ç", "C.a", "C", "Ş", "B"],
  ru: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

function toIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export interface DateInputProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  min?: string;
  max?: string;
  /** ISO dates that cannot be selected (occupied nights: check_in inclusive, check_out exclusive). */
  occupiedRanges?: Array<{ check_in: string; check_out: string; source?: string }>;
  /** When set (checkout picker), disable days whose stay from rangeStart would cross occupied nights. */
  rangeStart?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  variant?: "default" | "search" | "admin";
}

function isOccupiedIso(
  iso: string,
  ranges: Array<{ check_in: string; check_out: string }>,
): boolean {
  for (const range of ranges) {
    if (iso >= range.check_in && iso < range.check_out) return true;
  }
  return false;
}

function stayCrossesOccupied(
  start: string,
  end: string,
  ranges: Array<{ check_in: string; check_out: string }>,
): boolean {
  if (!start || !end || end <= start) return false;
  for (const range of ranges) {
    if (start < range.check_out && end > range.check_in) return true;
  }
  return false;
}

export function DateInput({
  id,
  name,
  value,
  defaultValue = "",
  onChange,
  min,
  max,
  occupiedRanges = [],
  rangeStart,
  required,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
  className = "",
  variant = "default",
}: DateInputProps) {
  const { locale } = useLocale();
  const autoId = useId();
  const inputId = id || autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties>({});
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value !== undefined ? value : internalValue;

  const [cursor, setCursor] = useState(() => {
    const parsed = parseIso(selected || defaultValue);
    return startOfMonth(parsed || new Date());
  });

  const todayIso = useMemo(() => toIso(new Date()), []);
  const weekdays = WEEKDAYS_BY_LOCALE[locale] || WEEKDAYS_BY_LOCALE.az;
  const defaultPlaceholder =
    locale === "ru" ? "Выберите дату" : locale === "en" ? "Select date" : "Tarix seçin";
  const fallbackPlaceholder = placeholder || defaultPlaceholder;

  const displayValue = useMemo(() => {
    const parsed = parseIso(selected);
    if (!parsed) return "";
    return formatDateDisplay(parsed, locale);
  }, [selected, locale]);

  const monthTitle = useMemo(
    () => formatMonthYear(cursor, locale),
    [cursor, locale],
  );

  const cells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: Array<{ day: number | null; iso?: string }> = [];

    for (let i = 0; i < firstWeekday; i++) list.push({ day: null });
    for (let day = 1; day <= daysInMonth; day++) {
      list.push({ day, iso: toIso(new Date(year, month, day)) });
    }
    while (list.length % 7 !== 0) list.push({ day: null });
    return list;
  }, [cursor]);

  const setSelected = useCallback(
    (next: string) => {
      if (value === undefined) setInternalValue(next);
      onChange?.(next);
    },
    [onChange, value],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const parsed = parseIso(selected);
    setCursor(startOfMonth(parsed || new Date()));
  }, [open, selected]);

  useEffect(() => {
    function syncViewport() {
      setIsMobile(window.matchMedia("(max-width: 640px)").matches);
    }
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useLayoutEffect(() => {
    if (!open || !mounted) return;

    function placePopover() {
      const trigger = rootRef.current;
      if (!trigger) return;

      if (window.matchMedia("(max-width: 640px)").matches) {
        setPopoverStyle({});
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const width = Math.min(320, window.innerWidth - 24);
      const estimatedHeight = 360;
      const gap = 8;
      const spaceBelow = window.innerHeight - rect.bottom - gap;
      const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow;

      let left = rect.left;
      if (left + width > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - width - 12);
      }
      left = Math.max(12, left);

      const headerOffset = 100;
      let top = openUp
        ? Math.max(headerOffset, rect.top - estimatedHeight - gap)
        : Math.min(rect.bottom + gap, window.innerHeight - estimatedHeight - 12);
      top = Math.max(headerOffset, top);

      setPopoverStyle({
        position: "fixed",
        top,
        left,
        width,
        right: "auto",
        bottom: "auto",
      });
    }

    placePopover();
    window.addEventListener("resize", placePopover);
    window.addEventListener("scroll", placePopover, true);
    return () => {
      window.removeEventListener("resize", placePopover);
      window.removeEventListener("scroll", placePopover, true);
    };
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: globalThis.MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isMobile]);

  function isDisabledDay(iso: string) {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    if (isOccupiedIso(iso, occupiedRanges)) return true;
    if (rangeStart && stayCrossesOccupied(rangeStart, iso, occupiedRanges)) return true;
    return false;
  }

  function isBusyDay(iso: string) {
    return isOccupiedIso(iso, occupiedRanges);
  }

  function pickDay(iso: string) {
    if (isDisabledDay(iso) || disabled) return;
    setSelected(iso);
    setOpen(false);
  }

  function clearDate(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setSelected("");
    setOpen(false);
  }

  const calendar = open && mounted
    ? createPortal(
        <>
          <button
            type="button"
            className={`date-input-backdrop${isMobile ? " is-mobile" : ""}`}
            aria-label="Close"
            onClick={() => setOpen(false)}
          />
          <div
            ref={popoverRef}
            className={`date-input-popover${isMobile ? " is-mobile" : ""}`}
            role="dialog"
            aria-label={monthTitle}
            style={isMobile ? undefined : popoverStyle}
          >
            <div className="date-input-nav">
              <button
                type="button"
                className="date-input-nav-btn"
                aria-label="Previous month"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                }
              >
                <ChevronLeft size={18} aria-hidden />
              </button>
              <p className="date-input-month">{monthTitle}</p>
              <button
                type="button"
                className="date-input-nav-btn"
                aria-label="Next month"
                onClick={() =>
                  setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                }
              >
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>

            <div className="date-input-weekdays">
              {weekdays.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="date-input-grid">
              {cells.map((cell, index) =>
                cell.day == null || !cell.iso ? (
                  <span key={`e-${index}`} className="date-input-day is-empty" />
                ) : (
                  <button
                    key={cell.iso}
                    type="button"
                    className={[
                      "date-input-day",
                      cell.iso === selected ? "is-selected" : "",
                      cell.iso === todayIso ? "is-today" : "",
                      isDisabledDay(cell.iso) ? "is-disabled" : "",
                      isBusyDay(cell.iso) ? "is-busy" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    disabled={isDisabledDay(cell.iso)}
                    title={isBusyDay(cell.iso) ? "Bu gün doludur" : undefined}
                    onClick={() => pickDay(cell.iso!)}
                  >
                    {cell.day}
                  </button>
                ),
              )}
            </div>

            <div className="date-input-footer">
              <button
                type="button"
                className="date-input-today"
                onClick={() => {
                  if (!isDisabledDay(todayIso)) pickDay(todayIso);
                }}
                disabled={isDisabledDay(todayIso)}
              >
                {locale === "ru" ? "Сегодня" : locale === "en" ? "Today" : "Bu gün"}
              </button>
            </div>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <div
      ref={rootRef}
      className={`date-input date-input--${variant} ${className}`.trim()}
    >
      {name ? <input type="hidden" name={name} value={selected} /> : null}

      <div className="date-input-control">
        <button
          type="button"
          id={inputId}
          className="date-input-trigger"
          aria-label={ariaLabel || fallbackPlaceholder}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-required={required || undefined}
          disabled={disabled}
          onClick={() => setOpen((prev) => !prev)}
        >
          <CalendarDays size={16} aria-hidden className="date-input-icon" />
          <span className={selected ? "date-input-value" : "date-input-placeholder"}>
            {displayValue || fallbackPlaceholder}
          </span>
        </button>
        {selected && !required ? (
          <button
            type="button"
            className="date-input-clear"
            aria-label="Clear"
            disabled={disabled}
            onClick={clearDate}
          >
            <X size={14} aria-hidden />
          </button>
        ) : null}
      </div>

      {calendar}
    </div>
  );
}
