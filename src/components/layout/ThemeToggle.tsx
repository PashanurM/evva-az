"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useLocale } from "@/providers/LocaleProvider";

function subscribeNoop() {
  return () => {};
}

/** Icon depends on localStorage — render a stable placeholder until mounted. */
export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const { t } = useLocale();
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggle}
      aria-label={t("theme.toggle")}
    >
      {!mounted ? (
        <Moon size={18} aria-hidden />
      ) : theme === "light" ? (
        <Moon size={18} aria-hidden />
      ) : (
        <Sun size={18} aria-hidden />
      )}
    </button>
  );
}
