"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  Eye,
  MapPin,
  MessageCircle,
  Pencil,
  Sparkles,
} from "lucide-react";
import { api, assetUrl } from "@/lib/api";
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
  is_active: boolean;
  is_featured: boolean;
  cover_url: string;
};

type OwnerBooking = {
  id: number;
  property_id: number;
  property_title: string;
  status: string;
  check_in: string;
  check_out: string;
  guest_name: string;
  guest_phone: string;
  guest_count: number;
  created_at: string;
};

type ConversationItem = {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  last_message: string;
  updated_at: string;
};

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Gözləyir",
    approved: "Təsdiqlənib",
    rejected: "Rədd edilib",
    cancelled: "Ləğv edilib",
    completed: "Tamamlanıb",
  };
  return map[status] || status;
}

export function MyHousesClient() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<OwnerProperty[]>([]);
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login?return=/my-houses");
      return;
    }
    if (user.role !== "owner" && user.role !== "admin") {
      setError("Bu panel yalnız ev sahibləri üçündür.");
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      setError("");
      const [housesRes, bookingsRes, chatsRes] = await Promise.all([
        api.getOwnerProperties(),
        api.getOwnerBookings(),
        api.getMyConversations(),
      ]);

      const failures: string[] = [];
      if (!housesRes.success || !housesRes.data) {
        failures.push(housesRes.error || "Evlər yüklənmədi");
        setItems([]);
      } else {
        setItems(housesRes.data.items);
      }

      if (!bookingsRes.success || !bookingsRes.data) {
        failures.push(bookingsRes.error || "Rezervlər yüklənmədi");
        setBookings([]);
      } else {
        setBookings(bookingsRes.data.items);
      }

      if (!chatsRes.success || !chatsRes.data) {
        failures.push(chatsRes.error || "Mesajlar yüklənmədi");
        setConversations([]);
      } else {
        setConversations(chatsRes.data.items);
      }

      setError(failures[0] || "");
      setLoading(false);
    })();
  }, [authLoading, user, router]);

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

  if (authLoading || loading) {
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
          mesajları bir yerdən izlə.
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

        {!error && items.length === 0 ? (
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
                    <span className={`admin-badge${house.is_active ? " admin-badge--ok" : ""}`}>
                      {house.is_active ? "Aktiv" : "Deaktiv"}
                    </span>
                  </div>
                  <p>
                    <MapPin size={14} /> {house.location}
                  </p>
                  <div className="owner-house-meta">
                    <span>{house.price} ₼/gecə</span>
                    <span>{house.rooms} otaq</span>
                    <span>{house.capacity} nəfər</span>
                    <span>
                      <Eye size={13} /> {house.views}
                    </span>
                    <span>
                      <CalendarCheck size={13} /> {house.booking_count} rezerv
                    </span>
                  </div>
                  <div className="owner-house-actions">
                    <Link href={`/my-houses/${house.id}/edit`} className="auth-btn primary">
                      <Pencil size={14} /> Redaktə et
                    </Link>
                    <Link href={`/property/${house.id}`} className="auth-btn">
                      Saytda bax
                    </Link>
                    <Link href="/messages" className="auth-btn">
                      Mesajlar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}

        <div className="owner-panel-section">
          <div className="owner-panel-section-head">
            <h2>Son mesajlar</h2>
            <Link href="/messages">Hamısı</Link>
          </div>
          {conversations.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>Hələ söhbət yoxdur.</p>
          ) : (
            <div className="messages-list">
              {conversations.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href={`/chat?conversation_id=${item.id}${item.property_id ? `&property_id=${item.property_id}` : ""}`}
                  className="messages-list-item"
                >
                  <div>
                    <strong>{item.property_title || "Söhbət"}</strong>
                    <span>{item.guest_name || "Qonaq"}</span>
                  </div>
                  <p>{item.last_message || "Mesaj yoxdur"}</p>
                  <small>{item.updated_at}</small>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="owner-panel-section">
          <div className="owner-panel-section-head">
            <h2>Rezervasiyalar</h2>
            <span>{bookings.length} ümumi</span>
          </div>
          {bookings.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>Hələ rezerv sorğusu yoxdur.</p>
          ) : (
            <div className="messages-list">
              {bookings.map((b) => (
                <div key={b.id} className="messages-list-item">
                  <div>
                    <strong>{b.property_title || `Elan #${b.property_id}`}</strong>
                    <span>
                      {b.guest_name} · {b.guest_phone}
                    </span>
                  </div>
                  <p>
                    {b.check_in} — {b.check_out} · {b.guest_count} nəfər
                  </p>
                  <div className="owner-booking-footer">
                    <span className={`admin-badge${b.status === "approved" ? " admin-badge--ok" : ""}`}>
                      {statusLabel(b.status)}
                    </span>
                    <small>{b.created_at}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
