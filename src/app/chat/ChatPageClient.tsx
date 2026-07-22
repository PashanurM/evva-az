"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import type { Property } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

interface ChatPageClientProps {
  property: Property | null;
}

type ChatMessage = {
  id: number;
  message: string;
  created_at: string;
  sender_name: string;
  is_mine: boolean;
};

export function ChatPageClient({ property }: ChatPageClientProps) {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationFromUrl = Number(searchParams.get("conversation_id") || 0);
  const propertyId = property?.id || Number(searchParams.get("property_id") || 0);

  const [conversationId, setConversationId] = useState(conversationFromUrl > 0 ? conversationFromUrl : 0);
  const [title, setTitle] = useState(property?.title || "");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyConversation = useCallback((data: {
    id: number;
    property_title?: string;
    messages?: ChatMessage[];
  }) => {
    setConversationId(data.id);
    if (data.property_title) setTitle(data.property_title);
    setMessages(data.messages || []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");
      try {
        if (conversationFromUrl > 0) {
          const res = await api.getConversation(conversationFromUrl);
          if (!res.success || !res.data) {
            setError(res.error || "Söhbət yüklənmədi");
          } else {
            applyConversation(res.data);
          }
        } else if (propertyId > 0) {
          // Always call start so backend role/permission errors surface in the UI.
          const res = await api.startChat(propertyId);
          if (!res.success || !res.data) {
            setError(res.error || "Chat başlatılmadı");
          } else {
            applyConversation(res.data);
            router.replace(`/chat?conversation_id=${res.data.id}&property_id=${propertyId}`);
          }
        }
      } catch {
        setError("Chat yüklənmədi");
      } finally {
        setLoading(false);
      }
    })();
  }, [authLoading, user, conversationFromUrl, propertyId, applyConversation, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(`/login?return=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!text.trim()) return;

    setBusy(true);
    setError("");
    try {
      let activeId = conversationId;
      if (activeId <= 0 && propertyId > 0) {
        const started = await api.startChat(propertyId);
        if (!started.success || !started.data) {
          setError(started.error || "Chat başlatılmadı");
          setBusy(false);
          return;
        }
        activeId = started.data.id;
        applyConversation(started.data);
        router.replace(`/chat?conversation_id=${started.data.id}&property_id=${propertyId}`);
      }
      if (activeId <= 0) {
        setError(t("chat.selectPropertyFirst"));
        setBusy(false);
        return;
      }

      const res = await api.sendChatMessage(activeId, text.trim());
      if (!res.success || !res.data) {
        setError(res.error || "Mesaj göndərilmədi");
      } else {
        setText("");
        applyConversation(res.data.conversation);
      }
    } catch {
      setError("Mesaj göndərilmədi");
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 720 }}>
          <p>{t("common.wait")}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="auth-shell">
        <div className="auth-card" style={{ maxWidth: 560 }}>
          <h1>{t("chat.title")}</h1>
          <p>{t("messages.loginRequired")}</p>
          <Link href={`/login?return=/chat${propertyId ? `?property_id=${propertyId}` : ""}`} className="auth-submit">
            {t("common.login")}
          </Link>
        </div>
      </div>
    );
  }

  const canCompose = conversationId > 0 || propertyId > 0;
  const blockedByError = Boolean(error) && conversationId <= 0;

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 720 }}>
        <span className="section-kicker">{t("chat.kicker")}</span>
        <h1>{t("chat.title")}</h1>
        {title ? <p>{t("chat.propertyPrompt", { title })}</p> : <p>{t("chat.selectPropertyFirst")}</p>}

        {error ? (
          <div className="auth-notice auth-notice-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="chat-thread">
          {messages.length === 0 ? (
            <p style={{ color: "var(--text-secondary)", textAlign: "center" }}>Hələ mesaj yoxdur.</p>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble${msg.is_mine ? " is-mine" : ""}`}>
                <strong>{msg.is_mine ? "Siz" : msg.sender_name || "İstifadəçi"}</strong>
                <p>{msg.message}</p>
                <small>{msg.created_at}</small>
              </div>
            ))
          )}
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="message">{t("chat.messageLabel")}</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("chat.messagePlaceholder")}
              disabled={blockedByError}
              style={{
                width: "100%",
                borderRadius: 16,
                border: "1px solid var(--border-color)",
                padding: 16,
                fontSize: 15,
                fontFamily: "inherit",
                resize: "vertical",
              }}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={busy || !canCompose || blockedByError}>
            <MessageCircle size={18} style={{ display: "inline", marginRight: 8 }} />
            {busy ? t("common.wait") : t("chat.send")}
          </button>
        </form>
        <div className="auth-links">
          <Link href="/messages">{t("messages.title")}</Link>
        </div>
      </div>
    </div>
  );
}
