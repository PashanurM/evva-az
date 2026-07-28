"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import "@/app/chat/chat-page.css";

type ConversationItem = {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  owner_name: string;
  peer_name?: string;
  viewer_is_owner?: boolean;
  last_message: string;
  updated_at: string;
  unread_count?: number;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
}

function formatListTime(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = raw.slice(0, 10);
    const time = raw.length >= 16 ? raw.slice(11, 16) : "";
    return time ? `${date} · ${time}` : date;
  }
  return raw;
}

export function MessagesPageClient() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      try {
        const res = await api.getMyConversations();
        if (cancelled) return;
        if (!res.success || !res.data) {
          setError(res.error || "Söhbətlər yüklənmədi");
          setItems([]);
        } else {
          setItems(res.data.items);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError("Söhbətlər yüklənmədi");
          setItems([]);
        }
      } finally {
        if (!cancelled && showSpinner) setLoading(false);
      }
    };

    void load(true);
    const timer = window.setInterval(() => {
      void load(false);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authLoading, user]);

  if (authLoading || (user && loading)) {
    return (
      <section className="chat-page">
        <div className="chat-page-glow" aria-hidden />
        <div className="chat-panel chat-panel--status">
          <Loader2 className="chat-spinner" size={28} aria-hidden />
          <p>{t("common.wait")}</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <AuthRequiredGate
        kicker={t("messages.contactKicker")}
        title={t("messages.title")}
        description={t("messages.loginRequired")}
        loginHref={`/login?return=${encodeURIComponent("/messages")}`}
        registerHref={`/register?return=${encodeURIComponent("/messages")}`}
        backHref="/"
        backLabel={t("common.back")}
      />
    );
  }

  const backHref = user.role === "owner" || user.role === "admin" ? "/my-houses" : "/";

  return (
    <section className="chat-page">
      <div className="chat-page-glow" aria-hidden />
      <div className="chat-panel chat-panel--inbox">
        <header className="chat-inbox-head">
          <Link href={backHref} className="chat-back-btn">
            <ArrowLeft size={18} aria-hidden />
            <span>{t("common.back")}</span>
          </Link>
          <div className="chat-inbox-title">
            <p className="chat-kicker">{t("messages.contactKicker")}</p>
            <h1>{t("messages.title")}</h1>
            <p>{t("messages.subtitle")}</p>
          </div>
        </header>

        {error ? (
          <div className="chat-alert" role="alert">
            {error}
          </div>
        ) : null}

        {!error && items.length === 0 ? (
          <div className="chat-empty">
            <MessageCircle size={28} aria-hidden />
            <p>{t("messages.empty")}</p>
            <Link href="/#properties" className="chat-btn chat-btn--primary" style={{ marginTop: 8 }}>
              Evlərə bax
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="chat-inbox-list">
            {items.map((item) => {
              const peer =
                item.peer_name ||
                (item.viewer_is_owner
                  ? item.guest_name || "Qonaq"
                  : item.owner_name || "Ev sahibi");
              const unread = item.unread_count || 0;
              return (
                <Link
                  key={item.id}
                  href={`/chat?conversation_id=${item.id}${item.property_id ? `&property_id=${item.property_id}` : ""}`}
                  className={`chat-inbox-item${unread > 0 ? " is-unread" : ""}`}
                >
                  <span className="chat-inbox-avatar" aria-hidden>
                    {initials(peer)}
                  </span>
                  <span className="chat-inbox-body">
                    <span className="chat-inbox-row">
                      <strong>{item.property_title || "Söhbət"}</strong>
                      <time>{formatListTime(item.updated_at)}</time>
                    </span>
                    <span className="chat-inbox-row chat-inbox-row--sub">
                      <em>{peer}</em>
                      {unread > 0 ? <span className="chat-unread-pill">{unread} yeni</span> : null}
                    </span>
                    <span className="chat-inbox-preview">
                      {item.last_message || "Mesaj yoxdur"}
                    </span>
                  </span>
                  <ChevronRight className="chat-inbox-chevron" size={18} aria-hidden />
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
