"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Pencil,
  Sparkles,
  Star,
} from "lucide-react";
import { api, assetUrl } from "@/lib/api";
import {
  consumePostLogoutRedirect,
  isAdminOwnerModeMarked,
  markAdminOwnerMode,
} from "@/lib/auth-redirect";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

type OwnerProperty = {
  id: number;
  title: string;
  location: string;
  price: number;
  capacity: number;
  rooms: number;
  views: number;
  booking_count: number;
  favorite_count: number;
  avg_rating?: number;
  rating_count?: number;
  rating_summary?: {
    avg_rating: number;
    rating_count: number;
    cleanliness_avg: number;
    location_avg: number;
    comfort_avg: number;
    homeowner_avg: number;
  };
  is_active: boolean;
  is_featured: boolean;
  cover_url: string;
};

type OwnerBooking = {
  id: number;
  property_id: number;
  property_title: string;
  conversation_id?: number;
  status: string;
  payment_status?: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  guest_count: number;
  created_at: string;
  contact_unlocked?: boolean;
  can_confirm?: boolean;
  can_cancel?: boolean;
  confirm_blocked_reason?: string;
};

type ConversationItem = {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  peer_name?: string;
  viewer_is_owner?: boolean;
  last_message: string;
  updated_at: string;
};

type OwnerRatingItem = {
  rating: number;
  comment: string;
  created_at: string;
  full_name: string;
  username: string;
  property_id?: number;
  property_title?: string;
  source?: string;
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Təsdiq gözləyir",
    payment_pending: "Təsdiq gözləyir",
    approved: "Təsdiqlənib",
    rejected: "Ləğv edilib",
    cancelled: "Ləğv edilib",
    completed: "Tamamlanıb",
  };
  return map[status] || status;
}

function formatOwnerTime(value: string): string {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) {
    return value.length > 16 ? value.slice(0, 16) : value;
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}.${month} ${hours}:${minutes}`;
}

export function MyHousesClient() {
  const { user, loading: authLoading, refresh } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<OwnerProperty[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [ownerRatings, setOwnerRatings] = useState<OwnerRatingItem[]>([]);
  const [ownerRatingAvg, setOwnerRatingAvg] = useState(0);
  const [ownerRatingCount, setOwnerRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authRetrying, setAuthRetrying] = useState(false);
  const [bookingBusy, setBookingBusy] = useState<number | null>(null);
  const authRetryDone = useRef(false);

  useEffect(() => {
    if (authLoading || authRetrying) return;

    if (!user) {
      // Admin→owner switch may land here before public AuthProvider has session.
      if (isAdminOwnerModeMarked() && !authRetryDone.current) {
        authRetryDone.current = true;
        setAuthRetrying(true);
        void (async () => {
          await refresh();
          setAuthRetrying(false);
        })();
        return;
      }
      router.replace(consumePostLogoutRedirect("/login?return=/my-houses"));
      return;
    }

    authRetryDone.current = false;

    if (user.role !== "owner" && user.role !== "admin") {
      setError("Bu panel yalnız ev sahibləri üçündür.");
      setLoading(false);
      return;
    }
    if (user.can_switch_owner || user.base_role === "admin") {
      markAdminOwnerMode(true);
    }

    void (async () => {
      setLoading(true);
      setError("");

      // Load houses first so panel is usable even if chat/bookings time out.
      const housesRes = await api.getOwnerProperties();
      if (!housesRes.success || !housesRes.data) {
        setItems([]);
        setError(housesRes.error || "Evlər yüklənmədi");
      } else {
        setItems(housesRes.data.items || []);
      }

      const [bookingsRes, chatsRes, ratingsRes] = await Promise.all([
        api.getOwnerBookings(),
        api.getMyConversations(),
        api.getOwnerRatings(),
      ]);

      const softFailures: string[] = [];
      if (!bookingsRes.success || !bookingsRes.data) {
        softFailures.push(bookingsRes.error || "Rezervlər yüklənmədi");
        setBookings([]);
      } else {
        setBookings(bookingsRes.data.items || []);
      }

      if (!chatsRes.success || !chatsRes.data) {
        softFailures.push(chatsRes.error || "Mesajlar yüklənmədi");
        setConversations([]);
      } else {
        setConversations(chatsRes.data.items || []);
      }

      if (ratingsRes.success && ratingsRes.data) {
        setOwnerRatings(ratingsRes.data.items || []);
        setOwnerRatingAvg(Number(ratingsRes.data.avg_rating || 0));
        setOwnerRatingCount(Number(ratingsRes.data.rating_count || 0));
      } else {
        setOwnerRatings([]);
        setOwnerRatingAvg(0);
        setOwnerRatingCount(0);
      }

      if (!housesRes.success) {
        setError(housesRes.error || softFailures[0] || "Evlər yüklənmədi");
      } else if (softFailures.length > 0) {
        setError(softFailures[0]);
      } else {
        setError("");
      }
      setLoading(false);
    })();
  }, [authLoading, authRetrying, user, router, refresh]);

  const stats = useMemo(() => {
    const activeHomes = items.filter((item) => item.is_active).length;
    const totalViews = items.reduce((sum, item) => sum + (item.views || 0), 0);
    const pendingBookings = bookings.filter((item) => item.status === "pending").length;
    return {
      homes: items.length,
      activeHomes,
      totalViews,
      bookings: bookings.length,
      pendingBookings,
      messages: conversations.length,
    };
  }, [items, bookings, conversations]);

  async function handleBookingAction(booking: OwnerBooking, action: "confirm" | "cancel") {
    if (booking.status !== "pending") return;

    if (action === "confirm" && !booking.can_confirm) {
      setError(booking.confirm_blocked_reason || "Təsdiq üçün əvvəlcə chatda mesajlaşın.");
      return;
    }
    if (action === "cancel" && !booking.can_cancel) {
      setError("Bu rezerv artıq ləğv edilə bilməz.");
      return;
    }

    if (action === "confirm") {
      const nights = Math.max(
        1,
        Math.round(
          (new Date(`${booking.check_out}T12:00:00`).getTime() -
            new Date(`${booking.check_in}T12:00:00`).getTime()) /
            86400000,
        ),
      );
      const feePerNight = 10;
      const feeTotal = nights * feePerNight;
      const ok = window.confirm(
        `Rezervasiya təsdiqlənəcək.\n\n` +
          `Ev: ${booking.property_title || `#${booking.property_id}`}\n` +
          `Tarix: ${booking.check_in} — ${booking.check_out}\n` +
          `Sayt payı: ${feeTotal} AZN (${nights} gecə × ${feePerNight} AZN)\n\n` +
          `Nömrələr açılacaq və sayt payı ödənişi gözləniləcək.\nDavam etmək istəyirsiniz?`,
      );
      if (!ok) return;
    }

    if (action === "cancel") {
      const ok = window.confirm(
        "Bu rezervasiya ləğv ediləcək.\nQonağa ləğv bildirişi gedəcək.\nDavam etmək istəyirsiniz?",
      );
      if (!ok) return;
    }

    setBookingBusy(booking.id);
    setError("");
    const res = await api.ownerBookingAction(booking.id, action);
    if (!res.success) {
      setError(res.error || "Əməliyyat uğursuz oldu");
      setBookingBusy(null);
      return;
    }
    if (res.data?.booking) {
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, ...res.data!.booking! } : item)),
      );
    } else {
      const refreshed = await api.getOwnerBookings();
      if (refreshed.success && refreshed.data) {
        setBookings(refreshed.data.items);
      }
    }
    setBookingBusy(null);
  }

  async function togglePremium(house: OwnerProperty) {
    router.push(`/my-houses/wallet?property_id=${house.id}`);
  }

  if (authLoading || authRetrying || (loading && Boolean(user))) {
    return (
      <section className="page-hero">
        <div className="container">
          <p>{t("common.wait")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-hero">
      <div className="container">
        <span className="section-kicker">{t("nav.ownerPanel")}</span>
        <h1>{t("comingSoon.myHousesTitle")}</h1>
        <p>
          Xoş gəldin{user?.full_name ? `, ${user.full_name}` : ""}. Evlərini, rezervləri və
          mesajları bir yerdən izlə. Saytdakı digər evlərə baxmaq üçün{" "}
          <Link href="/">Sayta bax</Link>.
        </p>

        {error ? (
          <div className="auth-notice auth-notice-error" role="alert" style={{ marginTop: 16 }}>
            {error}
          </div>
        ) : null}

        <div className="owner-stat-grid">
          <div className="owner-stat-card">
            <Building2 size={18} />
            <div>
              <span>Evlər</span>
              <strong>{stats.homes}</strong>
              <small>{stats.activeHomes} aktiv</small>
            </div>
          </div>
          <div className="owner-stat-card">
            <Eye size={18} />
            <div>
              <span>Baxış</span>
              <strong>{stats.totalViews}</strong>
              <small>ümumi baxış sayı</small>
            </div>
          </div>
          <div className="owner-stat-card">
            <CalendarCheck size={18} />
            <div>
              <span>Rezervlər</span>
              <strong>{stats.bookings}</strong>
              <small>{stats.pendingBookings} gözləyən</small>
            </div>
          </div>
          <div className="owner-stat-card">
            <MessageCircle size={18} />
            <div>
              <span>Mesajlar</span>
              <strong>{stats.messages}</strong>
              <small>
                <Link href="/messages">Hamısına bax</Link>
              </small>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="discover-card" style={{ marginTop: 24, textAlign: "center" }}>
            <Building2 size={40} style={{ margin: "0 auto 12px", color: "var(--primary)" }} />
            <p>Hələ heç bir ev əlavə olunmayıb.</p>
          </div>
        ) : null}

        {items.length > 0 ? (
          <div className="owner-houses-grid">
            {items.map((house) => (
              <article key={house.id} className="owner-house-card">
                <Link href={`/property/${house.id}`} className="owner-house-cover">
                  {house.cover_url ? (
                    <Image
                      src={assetUrl(house.cover_url)}
                      alt={house.title}
                      width={480}
                      height={220}
                      unoptimized
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div className="owner-house-cover-empty">
                      <Building2 size={28} />
                    </div>
                  )}
                  {house.is_featured ? (
                    <span className="owner-house-featured">
                      <Sparkles size={12} /> Seçilmiş
                    </span>
                  ) : null}
                </Link>
                <div className="owner-house-body">
                  <div className="owner-house-topline">
                    <h2>{house.title}</h2>
                    <span
                      className={`owner-status-badge${house.is_active ? " owner-status-badge--active" : " owner-status-badge--inactive"}`}
                    >
                      {house.is_active ? "Aktiv" : "Deaktiv"}
                    </span>
                  </div>
                  <p className="owner-house-location">
                    <MapPin size={14} /> {house.location}
                  </p>
                  <div className="owner-house-price-row">
                    <strong>{house.price} ₼</strong>
                    <span>/gecə</span>
                  </div>
                  <div className="owner-house-meta">
                    <span>{house.rooms} otaq</span>
                    <span>{house.capacity} nəfər</span>
                    <span>
                      <Eye size={13} /> {house.views}
                    </span>
                    <span>
                      <CalendarCheck size={13} /> {house.booking_count}
                    </span>
                    <span>
                      <Heart size={13} /> {house.favorite_count ?? 0}
                    </span>
                  </div>
                  <div className="owner-house-rating-line">
                    <Star size={14} fill={(house.rating_count || 0) > 0 ? "currentColor" : "none"} />
                    {(house.rating_count || 0) > 0 ? (
                      <span>
                        <b>{Number(house.avg_rating || 0).toFixed(1)}</b>
                        <em>({house.rating_count} rəy)</em>
                      </span>
                    ) : (
                      <span className="owner-house-rating-empty">Ev üçün dəyərləndirmə edilməyib</span>
                    )}
                  </div>
                  {(house.rating_count || 0) > 0 && house.rating_summary ? (
                    <div className="owner-house-ratings">
                      <span>Təmizlik {Number(house.rating_summary.cleanliness_avg || 0).toFixed(1)}</span>
                      <span>Yerləşmə {Number(house.rating_summary.location_avg || 0).toFixed(1)}</span>
                      <span>Rahatlıq {Number(house.rating_summary.comfort_avg || 0).toFixed(1)}</span>
                      <span>Ev sahibi {Number(house.rating_summary.homeowner_avg || 0).toFixed(1)}</span>
                    </div>
                  ) : null}
                  <div className="owner-house-actions">
                    <button
                      type="button"
                      className={`auth-btn owner-house-btn${house.is_featured ? " is-premium-on" : ""}`}
                      onClick={() => void togglePremium(house)}
                    >
                      <Sparkles size={14} />
                      {house.is_featured ? "Premiumdur · uzat" : "Premium et (ödənişli)"}
                    </button>
                    <Link href={`/my-houses/${house.id}/edit`} className="auth-btn primary owner-house-btn">
                      <Pencil size={14} /> Redaktə et
                    </Link>
                    <Link href={`/property/${house.id}`} className="auth-btn owner-house-btn">
                      Saytda bax
                    </Link>
                    <Link href="/messages" className="auth-btn owner-house-btn">
                      Mesajlar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="owner-panel-section owner-inbox-section owner-panel-card">
          <div className="owner-panel-section-head">
            <div className="owner-inbox-title">
              <MessageCircle size={18} aria-hidden />
              <h2>Son mesajlar</h2>
            </div>
            <Link href="/messages">Hamısı</Link>
          </div>
          {conversations.length === 0 ? (
            <div className="owner-inbox-empty">
              <MessageCircle size={22} aria-hidden />
              <p>Hələ söhbət yoxdur.</p>
            </div>
          ) : (
            <div className="owner-inbox-list">
              {conversations
                .filter((item) => item.viewer_is_owner !== false)
                .slice(0, 5)
                .map((item) => {
                const peer = item.peer_name || item.guest_name || "Qonaq";
                const initial = peer.trim().charAt(0).toUpperCase() || "Q";
                return (
                  <Link
                    key={item.id}
                    href={`/chat?conversation_id=${item.id}${item.property_id ? `&property_id=${item.property_id}` : ""}`}
                    className="owner-inbox-item"
                  >
                    <span className="owner-inbox-avatar" aria-hidden>
                      {initial}
                    </span>
                    <span className="owner-inbox-main">
                      <span className="owner-inbox-row">
                        <strong>{item.property_title || "Söhbət"}</strong>
                        <small>{formatOwnerTime(item.updated_at)}</small>
                      </span>
                      <span className="owner-inbox-guest">{peer}</span>
                      <span className="owner-inbox-preview">
                        {item.last_message || "Mesaj yoxdur"}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="owner-panel-section owner-panel-card">
          <div className="owner-panel-section-head">
            <h2>Rezervasiyalar</h2>
            <Link href="/my-houses/reservations">Hamısı</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="owner-panel-empty">Hələ rezerv sorğusu yoxdur.</p>
          ) : (
            <div className="messages-list">
              {bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="messages-list-item owner-booking-card">
                  <div>
                    <strong>{b.property_title || `Elan #${b.property_id}`}</strong>
                    <span>
                      {b.guest_name}
                      {b.contact_unlocked && b.guest_phone
                        ? ` · ${b.guest_phone}`
                        : " · Nömrə təsdiqdən sonra görünəcək"}
                    </span>
                  </div>
                  <p>
                    {b.check_in} — {b.check_out} · {b.guest_count} nəfər
                  </p>
                  <div className="owner-booking-footer">
                    <span
                      className={`admin-badge${
                        b.status === "approved" || b.status === "payment_pending"
                          ? " admin-badge--ok"
                          : ""
                      }`}
                    >
                      {statusLabel(b.status)}
                    </span>
                    <small>{b.created_at}</small>
                  </div>
                  {b.status === "pending" && b.confirm_blocked_reason ? (
                    <p className="owner-booking-hint">{b.confirm_blocked_reason}</p>
                  ) : null}
                  <div className="owner-booking-actions">
                    {b.conversation_id ? (
                      <Link
                        href={`/chat?conversation_id=${b.conversation_id}&property_id=${b.property_id}`}
                        className="auth-btn owner-house-btn"
                      >
                        Chat
                      </Link>
                    ) : null}
                    {b.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="auth-btn primary owner-house-btn"
                          disabled={!b.can_confirm || bookingBusy === b.id}
                          onClick={() => void handleBookingAction(b, "confirm")}
                          title={b.confirm_blocked_reason || "Təsdiqlə"}
                        >
                          Təsdiqlə
                        </button>
                        <button
                          type="button"
                          className="auth-btn owner-house-btn"
                          disabled={!b.can_cancel || bookingBusy === b.id}
                          onClick={() => void handleBookingAction(b, "cancel")}
                        >
                          Ləğv et
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="owner-panel-section owner-panel-card">
          <div className="owner-panel-section-head">
            <div className="owner-inbox-title">
              <Star size={18} aria-hidden />
              <h2>Reytinq tarixçəm</h2>
            </div>
            {ownerRatingCount > 0 ? (
              <span>
                {ownerRatingAvg.toFixed(1)} / 10 · {ownerRatingCount} rəy
              </span>
            ) : (
              <span>Rəy yoxdur</span>
            )}
          </div>
          {ownerRatings.length === 0 ? (
            <p className="owner-panel-empty">Sənin haqqında hələ reytinq yoxdur.</p>
          ) : (
            <div className="owner-rating-history">
              {ownerRatings.slice(0, 10).map((item, index) => (
                <article key={`${item.created_at}-${index}`} className="owner-rating-history-item">
                  <div className="owner-rating-history-head">
                    <strong>{item.full_name || item.username || "Qonaq"}</strong>
                    <span>{Number(item.rating || 0).toFixed(1)}/10</span>
                  </div>
                  {item.property_title ? (
                    <small>
                      {item.property_id ? (
                        <Link href={`/property/${item.property_id}`}>{item.property_title}</Link>
                      ) : (
                        item.property_title
                      )}
                    </small>
                  ) : null}
                  {item.comment ? <p>{item.comment}</p> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
