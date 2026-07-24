"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  MessageCircle,
  MoreVertical,
  Send,
  Trash2,
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

const AZ_MONTHS = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avqust",
  "sentyabr",
  "oktyabr",
  "noyabr",
  "dekabr",
];

function parseChatDate(value: string): Date | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function formatChatStamp(value: string): { primary: string; secondary: string } {
  const d = parseChatDate(value);
  if (!d) {
    const raw = String(value || "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
      const date = raw.slice(0, 10);
      const time = raw.length >= 16 ? raw.slice(11, 16) : "";
      return { primary: time || date, secondary: time ? date : "" };
    }
    return { primary: raw, secondary: "" };
  }

  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);

  let dayLabel: string;
  if (dayDiff === 0) dayLabel = "Bu gün";
  else if (dayDiff === 1) dayLabel = "Dünən";
  else if (d.getFullYear() === now.getFullYear()) {
    dayLabel = `${d.getDate()} ${AZ_MONTHS[d.getMonth()]}`;
  } else {
    dayLabel = `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
  }

  return { primary: time, secondary: dayLabel };
}

function dayKey(value: string): string {
  const d = parseChatDate(value);
  if (!d) return String(value || "").slice(0, 10);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function dayDividerLabel(value: string): string {
  const { secondary, primary } = formatChatStamp(value);
  // Prefer day label; fall back to date portion of primary if needed
  if (secondary === "Bu gün" || secondary === "Dünən") return secondary;
  if (secondary) return secondary;
  return primary;
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
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loginReturn = `/chat${propertyId > 0 ? `?property_id=${propertyId}` : ""}`;
  const loginHref = `/login?return=${encodeURIComponent(loginReturn)}`;
  const registerHref = `/register?return=${encodeURIComponent(loginReturn)}`;
  const backHref = conversationFromUrl > 0 ? "/messages" : propertyId > 0 ? `/property/${propertyId}` : "/messages";

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  }, []);

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

  useEffect(() => {
    if (openMenuId == null) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.(`[data-msg-menu="${openMenuId}"]`)) return;
      setOpenMenuId(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  async function handleCopy(msg: ChatMessage) {
    try {
      await navigator.clipboard.writeText(msg.message);
      showToast("Mesaj kopyalandı");
    } catch {
      showToast("Kopyalama alınmadı");
    }
    setOpenMenuId(null);
  }

  async function handleDelete(msg: ChatMessage) {
    if (!msg.is_mine || conversationId <= 0) return;
    const ok = window.confirm("Bu mesajı silmək istəyirsiniz?");
    if (!ok) {
      setOpenMenuId(null);
      return;
    }
    setDeletingId(msg.id);
    setOpenMenuId(null);
    setError("");
    try {
      const res = await api.deleteChatMessage(conversationId, msg.id);
      if (!res.success || !res.data) {
        setError(res.error || "Mesaj silinmədi");
      } else {
        applyConversation(res.data.conversation);
        showToast("Mesaj silindi");
      }
    } catch {
      setError("Mesaj silinmədi");
    } finally {
      setDeletingId(null);
    }
  }

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
          <Link href={backHref} className="chat-back-btn chat-back-btn--compact">
            <ArrowLeft size={18} aria-hidden />
            <span>{t("common.back")}</span>
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
            messages.map((msg, index) => {
              const stamp = formatChatStamp(msg.created_at);
              const prev = messages[index - 1];
              const showDay =
                !prev || dayKey(prev.created_at) !== dayKey(msg.created_at);
              const menuOpen = openMenuId === msg.id;

              return (
                <div key={msg.id} className="chat-msg-block">
                  {showDay ? (
                    <div className="chat-day-divider" role="separator">
                      <span>{dayDividerLabel(msg.created_at)}</span>
                    </div>
                  ) : null}
                  <div
                    className={`chat-bubble${msg.is_mine ? " is-mine" : ""}${menuOpen ? " is-menu-open" : ""}`}
                    data-msg-menu={msg.id}
                  >
                    <div className="chat-bubble-top">
                      <strong>{msg.is_mine ? "Siz" : msg.sender_name || "İstifadəçi"}</strong>
                      <div className="chat-msg-actions">
                        <button
                          type="button"
                          className="chat-msg-more"
                          aria-label="Mesaj əməliyyatları"
                          aria-expanded={menuOpen}
                          aria-haspopup="menu"
                          disabled={deletingId === msg.id}
                          onClick={() =>
                            setOpenMenuId((id) => (id === msg.id ? null : msg.id))
                          }
                        >
                          {deletingId === msg.id ? (
                            <Loader2 className="chat-spinner" size={16} />
                          ) : (
                            <MoreVertical size={16} aria-hidden />
                          )}
                        </button>
                        {menuOpen ? (
                          <div className="chat-msg-menu" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => void handleCopy(msg)}
                            >
                              <Copy size={15} aria-hidden />
                              <span>Kopyala</span>
                            </button>
                            {msg.is_mine ? (
                              <button
                                type="button"
                                role="menuitem"
                                className="is-danger"
                                onClick={() => void handleDelete(msg)}
                              >
                                <Trash2 size={15} aria-hidden />
                                <span>Sil</span>
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <p>{msg.message}</p>
                    <div className="chat-bubble-meta" title={`${stamp.secondary} ${stamp.primary}`.trim()}>
                      <time dateTime={msg.created_at}>
                        <span className="chat-bubble-time">{stamp.primary}</span>
                        {stamp.secondary ? (
                          <span className="chat-bubble-day">{stamp.secondary}</span>
                        ) : null}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {toast ? (
          <div className="chat-toast" role="status">
            <Check size={16} aria-hidden />
            <span>{toast}</span>
          </div>
        ) : null}

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
