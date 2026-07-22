"use client";

import { X } from "lucide-react";

type AdminSearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
};

export function AdminSearchField({
  value,
  onChange,
  placeholder = "Axtarış...",
  onSubmit,
  onClear,
  className = "",
  inputClassName = "admin-search-input",
  "aria-label": ariaLabel = "Axtarış",
}: AdminSearchFieldProps) {
  return (
    <div className={`admin-search-field${className ? ` ${className}` : ""}`}>
      <input
        className={inputClassName}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSubmit) onSubmit();
        }}
      />
      {value ? (
        <button
          type="button"
          className="admin-search-clear"
          aria-label="Axtarışı təmizlə"
          title="Təmizlə"
          onClick={() => {
            onChange("");
            onClear?.();
          }}
        >
          <X size={14} aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
