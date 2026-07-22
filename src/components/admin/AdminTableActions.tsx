"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";

type AdminTableActionsProps = {
  /** Always visible (info / view button). */
  info?: ReactNode;
  /** Other actions — inline on desktop, ⋮ menu on mobile. */
  children: ReactNode;
};

type MenuPos = { top: number; right: number };

export function AdminTableActions({ info = null, children }: AdminTableActionsProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, right: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="admin-table-actions" ref={rootRef}>
      <div className="admin-table-actions__info">{info}</div>
      <div className="admin-table-actions__desktop">{children}</div>
      <div className="admin-table-actions__mobile">
        <button
          ref={buttonRef}
          type="button"
          className="admin-btn admin-icon-btn admin-table-actions__more"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-controls={menuId}
          aria-label="Digər əməliyyatlar"
          onClick={() => setOpen((v) => !v)}
        >
          <MoreVertical size={15} aria-hidden="true" />
        </button>
        {mounted && open
          ? createPortal(
              <div
                ref={menuRef}
                id={menuId}
                className="admin-table-actions__menu admin-table-actions__menu--portal"
                role="menu"
                style={{ top: pos.top, right: pos.right }}
                onClick={() => setOpen(false)}
              >
                {children}
              </div>,
              document.body,
            )
          : null}
      </div>
    </div>
  );
}
