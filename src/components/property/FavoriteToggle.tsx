"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

interface FavoriteToggleProps {
  propertyId: number;
  initialFavorite?: boolean;
  className?: string;
  onChange?: (favorite: boolean) => void;
}

export function FavoriteToggle({
  propertyId,
  initialFavorite = false,
  className = "",
  onChange,
}: FavoriteToggleProps) {
  const { user, loading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [favorite, setFavorite] = useState(initialFavorite);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setFavorite(initialFavorite);
  }, [initialFavorite, propertyId]);

  function requireLogin() {
    const path = pathname && pathname !== "/login" ? pathname : "/";
    const query = typeof window !== "undefined" ? window.location.search : "";
    const next = query ? `${path}${query}` : path;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;
    if (!user) {
      requireLogin();
      return;
    }

    const action = favorite ? "remove" : "add";
    const previous = favorite;
    setFavorite(action === "add");

    startTransition(async () => {
      const res = await api.toggleFavorite(propertyId, action);
      if (!res.success) {
        setFavorite(previous);
        if (res.status === 401) requireLogin();
        return;
      }
      onChange?.(action === "add");
    });
  }

  const label = favorite
    ? t("favorites.removeAction")
    : t("favorites.addAction");

  return (
    <button
      type="button"
      className={`favorite-btn${favorite ? " is-active" : ""}${pending ? " is-pending" : ""}${className ? ` ${className}` : ""}`}
      onClick={toggle}
      aria-label={label}
      aria-pressed={favorite}
      title={label}
      disabled={pending}
    >
      <Heart size={18} fill={favorite ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
