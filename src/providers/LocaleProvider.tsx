"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  type Locale,
  isLocale,
} from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { createTranslator } from "@/i18n/translate";
import type { Dictionary } from "@/i18n/types";

type TranslateFn = ReturnType<typeof createTranslator>;

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  dict: Dictionary;
}

const fallbackDictionary = getDictionary(DEFAULT_LOCALE);
const fallbackContext: LocaleContextValue = {
  locale: DEFAULT_LOCALE,
  setLocale: (next) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("evva-locale-change"));
  },
  t: createTranslator(fallbackDictionary),
  dict: fallbackDictionary,
};

const LocaleContext = createContext<LocaleContextValue>(fallbackContext);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // The server and the first client render must use the same locale. Reading
  // localStorage during hydration would render a different language and make
  // React discard the server tree.
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const syncLocale = () => setLocaleState(readStoredLocale());
    const frame = window.requestAnimationFrame(syncLocale);

    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY) syncLocale();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("evva-locale-change", syncLocale);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("evva-locale-change", syncLocale);
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event("evva-locale-change"));
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);
  const t = useMemo(() => createTranslator(dict), [dict]);

  const value = useMemo(
    () => ({ locale, setLocale, t, dict }),
    [locale, setLocale, t, dict],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
