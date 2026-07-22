"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

type ConversationItem = {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  owner_name: string;
  last_message: string;
  updated_at: string;
};

export function MessagesPageClient() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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
      <section className="page-hero">
        <div className="container">
          <p>{t("common.wait")}</p>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page-hero">
        <div className="container">
          <span className="section-kicker">{t("messages.contactKicker")}</span>
          <h1>{t("messages.title")}</h1>
          <p>{t("messages.intro")}</p>
          <div className="discover-card" style={{ maxWidth: 520, marginTop: 24, textAlign: "center" }}>
            <MessageCircle size={40} style={{ margin: "0 auto 16px", color: "var(--primary)" }} />
            <p>{t("messages.loginRequired")}</p>
            <Link
              href="/login?return=/messages"
              className="auth-btn primary"
              style={{ marginTop: 12 }}
              onClick={() => router.push("/login?return=/messages")}
            >
              {t("common.login")}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-hero">
      <div className="container">
        <span className="section-kicker">{t("messages.contactKicker")}</span>
        <h1>{t("messages.title")}</h1>
        <p>{t("messages.intro")}</p>

        {error ? (
          <div className="auth-notice auth-notice-error" role="alert" style={{ marginTop: 16 }}>
            {error}
          </div>
        ) : null}

        {!error && items.length === 0 ? (
          <div className="discover-card" style={{ marginTop: 24, textAlign: "center" }}>
            <MessageCircle size={40} style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
            <p>Hələ söhbət yoxdur.</p>
            <Link href="/" className="auth-btn" style={{ marginTop: 12 }}>
              Evlərə bax
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="messages-list">
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
                  <small>{item.updated_at}</small>
                </Link>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
