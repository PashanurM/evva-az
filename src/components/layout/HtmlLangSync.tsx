"use client";

import { useEffect } from "react";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale } from "@/i18n/config";

/** Syncs html[lang] from localStorage before/after hydration. */
export function HtmlLangSync() {
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    document.documentElement.lang = isLocale(stored) ? stored : DEFAULT_LOCALE;

    const onChange = () => {
      const next = window.localStorage.getItem(LOCALE_STORAGE_KEY);
      document.documentElement.lang = isLocale(next) ? next : DEFAULT_LOCALE;
    };

    window.addEventListener("evva-locale-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("evva-locale-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return null;
}
