"use client";

import "./unread-dot.css";

export function UnreadDot({
  show,
  className = "",
  label = "Yeni mesaj",
}: {
  show: boolean;
  className?: string;
  label?: string;
}) {
  if (!show) return null;
  return (
    <span
      className={`evva-unread-dot${className ? ` ${className}` : ""}`}
      aria-label={label}
      title={label}
    />
  );
}
