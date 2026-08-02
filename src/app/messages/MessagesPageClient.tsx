"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Loader2,
  LogIn,
  MessageCircle,
  Search,
  Shield,
} from "lucide-react";
import { api } from "@/lib/api";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { OwnerShell } from "@/components/owner/OwnerShell";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { notifyChatUnreadRefresh } from "@/providers/UnreadMessagesProvider";
import "@/app/chat/chat-page.css";

function isAuthError(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("giriş tələb") ||
    text.includes("login required") ||
    text.includes("unauthorized") ||
    text.includes("401") ||
    text.includes("daxil ol")
  );
}

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

function peerName(item: ConversationItem): string {
  return (
    item.peer_name ||
    (item.viewer_is_owner
      ? item.guest_name || "Qonaq"
      : item.owner_name || "Ev sahibi")
  );
}

export function MessagesPageClient() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [query, setQuery] = useState("");

  const isOwner = user?.role === "owner" || user?.view_mode === "owner";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setNeedsLogin(true);
      return;
    }
    setNeedsLogin(false);

    let cancelled = false;

    const load = async (showSpinner: boolean) => {
      if (showSpinner) setLoading(true);
      try {
        const res = await api.getMyConversations();
        if (cancelled) return;
        if (!res.success || !res.data) {
          const err = res.error || "Söhbətlər yüklənmədi";
          setError(err);
          setItems([]);
          if (isAuthError(err)) setNeedsLogin(true);
        } else {
          setItems(res.data.items);
          setError("");
          setNeedsLogin(false);
          notifyChatUnreadRefresh();
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const hay = [
        item.property_title,
        peerName(item),
        item.last_message,
        item.guest_name,
        item.owner_name,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const unreadTotal = useMemo(
    () => items.reduce((sum, item) => sum + (item.unread_count || 0), 0),
    [items],
  );

  if (authLoading || (user && loading)) {
    return (
      <section className="msg-page">
        <div className="msg-shell msg-shell--status">
          <Loader2 className="chat-spinner" size={28} aria-hidden />
          <p>{t("common.wait")}</p>
        </div>
      </section>
    );
  }

  if (!user || needsLogin) {
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

  const backHref = isOwner ? "/my-houses" : "/";
  const loginHref = `/login?return=${encodeURIComponent("/messages")}`;

  const content = (
    <section className={`msg-page${isOwner ? " msg-page--owner" : ""}`}>
      <div className="msg-shell">
        <header className="msg-head">
          <div className="msg-head-top">
            <Link href={backHref} className="msg-back">
              <ArrowLeft size={18} aria-hidden />
              <span>{isOwner ? t("messages.backToPanel") : t("common.back")}</span>
            </Link>
            {unreadTotal > 0 ? (
              <span className="msg-unread-total">
                {t("messages.unreadCount", { count: unreadTotal })}
              </span>
            ) : null}
          </div>
          <div className="msg-head-copy">
            <h1>{t("messages.title")}</h1>
            <p>{t("messages.subtitle")}</p>
          </div>
          <label className="msg-search">
            <Search size={18} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("messages.searchPlaceholder")}
              aria-label={t("messages.searchPlaceholder")}
            />
          </label>
        </header>

        {error ? (
          <div className="msg-alert" role="alert">
            <p>{error}</p>
            {isAuthError(error) ? (
              <Link href={loginHref} className="msg-btn msg-btn--primary">
                <LogIn size={18} aria-hidden />
                {t("common.login")}
              </Link>
            ) : null}
          </div>
        ) : null}

        {!error && filtered.length === 0 ? (
          <div className="msg-empty">
            <span className="msg-empty-icon" aria-hidden>
              <MessageCircle size={28} />
            </span>
            <strong>
              {items.length === 0 ? t("messages.empty") : t("messages.emptySearch")}
            </strong>
            <p>{t("messages.emptyHint")}</p>
            <div className="msg-empty-actions">
              <Link href="/chat?to_admin=1" className="msg-btn msg-btn--primary">
                <Shield size={16} aria-hidden />
                {t("footer.messageAdmin")}
              </Link>
              {!isOwner ? (
                <Link href="/homes" className="msg-btn">
                  <Building2 size={16} aria-hidden />
                  {t("common.browseHomes")}
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <ul className="msg-list">
            {filtered.map((item) => {
              const peer = peerName(item);
              const unread = item.unread_count || 0;
              return (
                <li key={item.id}>
                  <Link
                    href={`/chat?conversation_id=${item.id}${item.property_id ? `&property_id=${item.property_id}` : ""}`}
                    className={`msg-item${unread > 0 ? " is-unread" : ""}`}
                  >
                    <span className="msg-avatar" aria-hidden>
                      {initials(peer)}
                      {unread > 0 ? <em className="msg-avatar-dot" /> : null}
                    </span>
                    <span className="msg-item-main">
                      <span className="msg-item-row">
                        <strong>{item.property_title || "Söhbət"}</strong>
                        <time>{formatListTime(item.updated_at)}</time>
                      </span>
                      <span className="msg-item-row msg-item-row--peer">
                        <span>{peer}</span>
                        {unread > 0 ? (
                          <span className="msg-count">{unread}</span>
                        ) : null}
                      </span>
                      <span className="msg-preview">
                        {item.last_message || t("messages.noMessage")}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

        <footer className="msg-foot">
          <Link href="/chat?to_admin=1" className="msg-foot-link">
            <Shield size={15} aria-hidden />
            {t("footer.messageAdmin")}
          </Link>
        </footer>
      </div>
    </section>
  );

  if (isOwner) {
    return <OwnerShell>{content}</OwnerShell>;
  }

  return content;
}
