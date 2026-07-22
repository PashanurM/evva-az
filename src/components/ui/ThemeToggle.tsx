"use client";

import { useEffect, useSyncExternalStore } from "react";

function applyTheme(dark: boolean): void {
  document.body.classList.toggle("dark-theme", dark);
  document.documentElement.classList.toggle("dark-theme", dark);
  document.documentElement.dataset.theme = dark ? "dark" : "light";
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(
    (notify) => {
      window.addEventListener("storage", notify);
      window.addEventListener("evva-theme-change", notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener("evva-theme-change", notify);
      };
    },
    () => localStorage.getItem("theme") === "dark",
    () => false,
  );

  useEffect(() => {
    applyTheme(dark);
  }, [dark]);

  const toggle = () => {
    const next = !dark;
    applyTheme(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    window.dispatchEvent(new Event("evva-theme-change"));
  };

  return (
    <button
      className="theme-toggle"
      id="themeToggle"
      type="button"
      aria-label="Tema dəyiş"
      aria-pressed={dark}
      title={dark ? "Açıq tema" : "Qaranlıq tema"}
      data-react-theme-toggle="1"
      onClick={toggle}
      suppressHydrationWarning
    >
      <i className={`fas ${dark ? "fa-sun" : "fa-moon"}`} suppressHydrationWarning />
    </button>
  );
}
