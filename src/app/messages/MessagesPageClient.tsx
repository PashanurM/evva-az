"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageCircle } from "lucide-react";
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
  last_message: string;
  updated_at: string;
  unread_count?: number;
};

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

    void (async () => {
      setLoading(true);
      const res = await api.getMyConversations();
      if (!res.success || !res.data) {
        setError(res.error || "Söhbətlər yüklənmədi");
        setItems([]);
      } else {
        setItems(res.data.items);
        setError("");
      }
      setLoading(false);
    })();
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

  return (
    <section className="chat-page">
      <div className="chat-page-glow" aria-hidden />
      <div className="chat-panel chat-panel--room" style={{ minHeight: "auto" }}>
        <header className="chat-room-head" style={{ gridTemplateColumns: "1fr" }}>
          <div className="chat-room-meta">
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
          <div className="messages-list messages-list--panel">
            {items.map((item) => {
              const peer =
                user.role === "owner" || user.role === "admin"
                  ? item.guest_name || "Qonaq"
                  : item.owner_name || "Ev sahibi";
              return (
                <Link
                  key={item.id}
                  href={`/chat?conversation_id=${item.id}${item.property_id ? `&property_id=${item.property_id}` : ""}`}
                  className="messages-list-item"
                >
                  <div>
                    <strong>{item.property_title || "Söhbət"}</strong>
                    <span>{peer}</span>
                  </div>
                  <p>{item.last_message || "Mesaj yoxdur"}</p>
                  <small>
                    {item.updated_at}
                    {(item.unread_count || 0) > 0 ? ` · ${item.unread_count} yeni` : ""}
                  </small>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
