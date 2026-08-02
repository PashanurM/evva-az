"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

interface UnreadMessagesContextValue {
  unreadCount: number;
  hasUnread: boolean;
  refresh: () => Promise<void>;
  clearLocal: () => void;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextValue | null>(null);

export function UnreadMessagesProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await api.getChatUnread();
      if (res.success && res.data) {
        setUnreadCount(Math.max(0, Number(res.data.unread_count) || 0));
      }
    } catch {
      // Keep last known count on transient failures.
    }
  }, [user]);

  const clearLocal = useCallback(() => {
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setUnreadCount(0);
      return;
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 10000);

    const onFocus = () => {
      void refresh();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const onUnreadRefresh = () => {
      void refresh();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("evva:chat-unread-refresh", onUnreadRefresh);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("evva:chat-unread-refresh", onUnreadRefresh);
    };
  }, [authLoading, user, refresh]);

  const value = useMemo(
    () => ({
      unreadCount,
      hasUnread: unreadCount > 0,
      refresh,
      clearLocal,
    }),
    [unreadCount, refresh, clearLocal],
  );

  return (
    <UnreadMessagesContext.Provider value={value}>
      {children}
    </UnreadMessagesContext.Provider>
  );
}

export function useUnreadMessages() {
  const ctx = useContext(UnreadMessagesContext);
  if (!ctx) {
    return {
      unreadCount: 0,
      hasUnread: false,
      refresh: async () => undefined,
      clearLocal: () => undefined,
    };
  }
  return ctx;
}

export function notifyChatUnreadRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("evva:chat-unread-refresh"));
}
