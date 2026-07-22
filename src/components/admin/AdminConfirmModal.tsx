"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle } from "lucide-react";

export type AdminConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type ModalState = AdminConfirmOptions & {
  resolve: (value: boolean) => void;
};

type AdminConfirmModalViewProps = AdminConfirmOptions & {
  open: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmModalView({
  open,
  title,
  message,
  confirmLabel = "Bəli, sil",
  cancelLabel = "Ləğv et",
  busy = false,
  onConfirm,
  onCancel,
}: AdminConfirmModalViewProps) {
  const titleId = useId();
  const messageId = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="admin-confirm-overlay" role="presentation" onClick={() => !busy && onCancel()}>
      <div
        className="admin-confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="admin-confirm-modal__icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <div className="admin-confirm-modal__body">
          <h2 id={titleId} className="admin-confirm-modal__title">
            {title}
          </h2>
          <p id={messageId} className="admin-confirm-modal__message">
            {message}
          </p>
        </div>
        <div className="admin-confirm-modal__actions">
          <button type="button" className="admin-btn" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="admin-btn admin-btn--danger" disabled={busy} onClick={onConfirm}>
            {busy ? "Silinir..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function useAdminConfirm() {
  const [state, setState] = useState<ModalState | null>(null);

  const confirm = useCallback((options: AdminConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const close = useCallback((value: boolean) => {
    setState((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const modal: ReactNode = state ? (
    <AdminConfirmModalView
      open
      title={state.title}
      message={state.message}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  ) : null;

  return { confirm, modal };
}
