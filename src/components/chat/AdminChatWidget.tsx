"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { api } from "@/lib/api";
import { UnreadDot } from "@/components/chat/UnreadDot";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import {
  notifyChatUnreadRefresh,
  useUnreadMessages,
} from "@/providers/UnreadMessagesProvider";
import "./admin-chat-widget.css";

type WidgetMessage = {
  id: number;
  message: string;
  created_at: string;
  is_mine: boolean;
  is_system?: boolean;
};

export function AdminChatWidget() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const { hasUnread, refresh: refreshUnread, clearLocal } = useUnreadMessages();
  const pathname = usePathname();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState(0);
  const [messages, setMessages] = useState<WidgetMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);

  const hideOnRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/chat");

  const isAdminUser = user?.role === "admin";

  const applyConversation = useCallback(
    (data: {
      id: number;
      messages?: WidgetMessage[];
    }) => {
      setConversationId(data.id);
      setMessages(data.messages || []);
      clearLocal();
      void refreshUnread();
    },
    [clearLocal, refreshUnread],
  );

  const ensureConversation = useCallback(async () => {
    if (!user || isAdminUser) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.startAdminChat();
      if (!res.success || !res.data) {
        setError(res.error || t("chat.widgetLoadError"));
        return;
      }
      applyConversation(res.data);
      notifyChatUnreadRefresh();
    } catch {
      setError(t("chat.widgetLoadError"));
    } finally {
      setLoading(false);
    }
  }, [user, isAdminUser, applyConversation, t]);

  useEffect(() => {
    if (!open || !user || isAdminUser) return;
    void ensureConversation();
  }, [open, user, isAdminUser, ensureConversation]);

  useEffect(() => {
    if (!open || !user || conversationId <= 0 || loading) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await api.getConversation(conversationId);
        if (cancelled || !res.success || !res.data) return;
        setMessages(res.data.messages || []);
        notifyChatUnreadRefresh();
      } catch {
        // Keep last known messages.
      }
    };

    const timer = window.setInterval(() => {
      void poll();
    }, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, user, conversationId, loading]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, open]);

  function handleFabClick() {
    if (authLoading) return;
    if (!user) {
      const returnTo = "/chat?to_admin=1";
      router.push(`/login?return=${encodeURIComponent(returnTo)}`);
      return;
    }
    if (isAdminUser) {
      router.push("/messages");
      return;
    }
    setOpen((v) => !v);
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const message = text.trim();
    if (!message || conversationId <= 0 || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await api.sendChatMessage(conversationId, message);
      if (!res.success || !res.data) {
        setError(res.error || t("chat.widgetSendError"));
        return;
      }
      setText("");
      if (res.data.conversation) {
        applyConversation(res.data.conversation);
      }
      notifyChatUnreadRefresh();
    } catch {
      setError(t("chat.widgetSendError"));
    } finally {
      setSending(false);
    }
  }

  if (hideOnRoute) return null;

  return (
    <div className={`admin-chat-widget${open ? " is-open" : ""}`}>
      {open && user && !isAdminUser ? (
        <div className="admin-chat-panel" role="dialog" aria-label={t("chat.widgetTitle")}>
          <header className="admin-chat-panel-head">
            <div>
              <strong>{t("chat.widgetTitle")}</strong>
              <small>{t("chat.widgetSubtitle")}</small>
            </div>
            <button
              type="button"
              className="admin-chat-icon-btn"
              aria-label={t("common.close")}
              onClick={() => setOpen(false)}
            >
              <X size={18} aria-hidden />
            </button>
          </header>

          <div className="admin-chat-thread" ref={threadRef}>
            {loading ? (
              <div className="admin-chat-status">
                <Loader2 className="admin-chat-spin" size={22} aria-hidden />
                <span>{t("common.wait")}</span>
              </div>
            ) : null}
            {!loading && messages.length === 0 ? (
              <div className="admin-chat-status">
                <p>{t("chat.widgetEmpty")}</p>
              </div>
            ) : null}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`admin-chat-bubble${msg.is_mine ? " is-mine" : ""}${msg.is_system ? " is-system" : ""}`}
              >
                <p>{msg.message}</p>
              </div>
            ))}
          </div>

          {error ? (
            <div className="admin-chat-error" role="alert">
              {error}
            </div>
          ) : null}

          <form className="admin-chat-compose" onSubmit={(e) => void handleSend(e)}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("chat.widgetPlaceholder")}
              aria-label={t("chat.messageLabel")}
              disabled={loading || sending || conversationId <= 0}
              maxLength={2000}
            />
            <button
              type="submit"
              className="admin-chat-send"
              disabled={loading || sending || !text.trim() || conversationId <= 0}
              aria-label={t("chat.send")}
            >
              {sending ? <Loader2 className="admin-chat-spin" size={18} /> : <Send size={18} />}
            </button>
          </form>

          <Link href="/messages" className="admin-chat-inbox-link" onClick={() => setOpen(false)}>
            {t("chat.widgetOpenInbox")}
          </Link>
        </div>
      ) : null}

      <button
        type="button"
        className="admin-chat-fab"
        onClick={handleFabClick}
        aria-label={t("chat.widgetTitle")}
        aria-expanded={open}
      >
        {open ? <X size={24} aria-hidden /> : <MessageCircle size={24} aria-hidden />}
        <UnreadDot
          show={!open && hasUnread && Boolean(user)}
          className="evva-unread-dot--corner"
        />
      </button>
    </div>
  );
}
