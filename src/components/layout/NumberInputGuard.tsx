"use client";

import { useEffect } from "react";

/**
 * Global guard: number inputs cannot go below their min (default 0).
 * Covers min/max price and any other type="number" fields across the app.
 */
export function NumberInputGuard() {
  useEffect(() => {
    function resolveMin(el: HTMLInputElement): number {
      if (el.min !== "") {
        const parsed = Number(el.min);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    }

    function onKeyDown(event: KeyboardEvent) {
      const el = event.target as HTMLInputElement | null;
      if (!el || el.tagName !== "INPUT" || el.type !== "number") return;

      const min = resolveMin(el);
      if (min >= 0 && (event.key === "-" || event.key === "Subtract" || event.key === "–")) {
        event.preventDefault();
      }
    }

    function clamp(el: HTMLInputElement) {
      if (el.type !== "number" || el.value === "") return;
      const min = resolveMin(el);
      const max = el.max === "" ? Number.POSITIVE_INFINITY : Number(el.max);
      const value = Number(el.value);
      if (!Number.isFinite(value)) return;

      let next = value;
      if (value < min) next = min;
      if (Number.isFinite(max) && value > max) next = max;
      if (next === value) return;

      el.value = String(next);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    function onInput(event: Event) {
      const el = event.target as HTMLInputElement | null;
      if (!el || el.tagName !== "INPUT" || el.type !== "number") return;
      clamp(el);
    }

    function onWheel(event: WheelEvent) {
      const el = event.target as HTMLInputElement | null;
      if (!el || el.tagName !== "INPUT" || el.type !== "number") return;
      // Prevent accidental value changes while scrolling the page.
      if (document.activeElement === el) {
        el.blur();
      }
    }

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("input", onInput, true);
    document.addEventListener("change", onInput, true);
    document.addEventListener("wheel", onWheel, { capture: true, passive: true });

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("input", onInput, true);
      document.removeEventListener("change", onInput, true);
      document.removeEventListener("wheel", onWheel, true);
    };
  }, []);

  return null;
}
