"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Property } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import "./chat-page.css";

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

function formatChatTime(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  // Keep SSR/client stable — avoid Intl locale formatting mismatch.
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    const date = raw.slice(0, 10);
    const time = raw.length >= 16 ? raw.slice(11, 16) : "";
    return time ? `${date} ${time}` : date;
  }
  return raw;
}

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
  const threadRef = useRef<HTMLDivElement>(null);

  const loginReturn = `/chat${propertyId > 0 ? `?property_id=${propertyId}` : ""}`;
  const loginHref = `/login?return=${encodeURIComponent(loginReturn)}`;
  const registerHref = `/register?return=${encodeURIComponent(loginReturn)}`;
  const backHref = propertyId > 0 ? `/property/${propertyId}` : "/messages";

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
          const res = await api.startChat(propertyId);
          if (!res.success || !res.data) {
            const inbox = await api.getMyConversations();
            const match = inbox.data?.items?.find((item) => item.property_id === propertyId);
            if (match) {
              router.replace(`/chat?conversation_id=${match.id}&property_id=${propertyId}`);
              return;
            }
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

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) {
      router.push(loginHref);
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
        kicker={t("chat.kicker")}
        title={t("chat.title")}
        description={t("messages.loginRequired")}
        propertyTitle={property?.title || title || undefined}
        loginHref={loginHref}
        registerHref={registerHref}
        backHref={backHref}
        backLabel={propertyId > 0 ? t("common.back") : t("messages.title")}
      />
    );
  }

  const canCompose = conversationId > 0 || propertyId > 0;
  const blockedByError = Boolean(error) && conversationId <= 0;

  return (
    <section className="chat-page">
      <div className="chat-page-glow" aria-hidden />
      <div className="chat-panel chat-panel--room">
        <header className="chat-room-head">
          <Link href={backHref} className="chat-icon-btn" aria-label={t("common.back")}>
            <ArrowLeft size={18} />
          </Link>
          <div className="chat-room-meta">
            <p className="chat-kicker">{t("chat.kicker")}</p>
            <h1>{title || t("chat.title")}</h1>
            <p>
              {title
                ? t("chat.propertyPrompt", { title })
                : t("chat.selectPropertyFirst")}
            </p>
          </div>
          <Link href="/messages" className="chat-icon-btn" aria-label={t("messages.title")}>
            <MessageCircle size={18} />
          </Link>
        </header>

        {error ? (
          <div className="chat-alert" role="alert">
            {error}
          </div>
        ) : null}

        <div className="chat-thread" ref={threadRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <MessageCircle size={28} aria-hidden />
              <p>Hələ mesaj yoxdur. İlk salamı siz yazın.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`chat-bubble${msg.is_mine ? " is-mine" : ""}`}>
                <strong>{msg.is_mine ? "Siz" : msg.sender_name || "İstifadəçi"}</strong>
                <p>{msg.message}</p>
                <small>{formatChatTime(msg.created_at)}</small>
              </div>
            ))
          )}
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="message">
            {t("chat.messageLabel")}
          </label>
          <textarea
            id="message"
            name="message"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("chat.messagePlaceholder")}
            disabled={blockedByError}
          />
          <button
            type="submit"
            className="chat-btn chat-btn--primary chat-send"
            disabled={busy || !canCompose || blockedByError || !text.trim()}
          >
            {busy ? <Loader2 className="chat-spinner" size={18} /> : <Send size={18} />}
            <span>{busy ? t("common.wait") : t("chat.send")}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
