"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";
import { LOCALES, LOCALE_LABELS, type Locale } from "@/i18n/config";
import { useLocale } from "@/providers/LocaleProvider";

interface LanguageSwitcherProps {
  variant?: "nav" | "menu";
}

export function LanguageSwitcher({ variant = "nav" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (variant === "menu") {
    return (
      <div className="lang-switcher lang-switcher--menu" role="group" aria-label={t("language.label")}>
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            className={`lang-switcher-btn${locale === code ? " active" : ""}`}
            aria-pressed={locale === code}
            aria-label={t(`language.${code}` as `language.${Locale}`)}
            onClick={() => setLocale(code)}
          >
            {LOCALE_LABELS[code]}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="lang-switcher lang-switcher--nav">
      <button
        type="button"
        className="lang-nav-toggle"
        aria-label={t("language.label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe size={16} aria-hidden />
        <span>{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <ul className="lang-nav-menu" role="listbox" aria-label={t("language.label")}>
          {LOCALES.map((code) => (
            <li key={code} role="option" aria-selected={locale === code}>
              <button
                type="button"
                className={`lang-nav-option${locale === code ? " active" : ""}`}
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
              >
                <span>{LOCALE_LABELS[code]}</span>
                <small>{t(`language.${code}` as `language.${Locale}`)}</small>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
