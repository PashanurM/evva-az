"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";

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

function paymentLabel(status?: string): string {
  const map: Record<string, string> = {
    none: "—",
    awaiting_site_fee: "Platforma ödənişi gözləyir",
    site_fee_paid: "Platforma ödənişi edilib",
    cancelled: "Ləğv edilib",
  };
  return map[status || "none"] || status || "—";
}

export function OwnerReservationsClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<OwnerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [bookingBusy, setBookingBusy] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (user.role !== "owner" && user.role !== "admin") {
      router.replace("/");
      return;
    }

    void (async () => {
      setLoading(true);
      const res = await api.getOwnerBookings();
      if (!res.success || !res.data) {
        setError(res.error || "Rezervasiyalar yüklənmədi");
        setBookings([]);
      } else {
        setBookings(res.data.items || []);
        setError("");
      }
      setLoading(false);
    })();
  }, [authLoading, user, router]);

  const filtered = useMemo(() => {
    if (filter === "all") return bookings;
    if (filter === "awaiting") {
      return bookings.filter((b) => b.status === "pending" || b.status === "payment_pending");
    }
    if (filter === "approved") return bookings.filter((b) => b.status === "approved");
    if (filter === "cancelled") {
      return bookings.filter((b) => b.status === "cancelled" || b.status === "rejected");
    }
    return bookings;
  }, [bookings, filter]);

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

  if (authLoading || (user && loading)) {
    return (
      <div className="owner-panel">
        <div className="container">
          <p className="owner-panel-empty">Yüklənir...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthRequiredGate
        kicker="Ev sahibi"
        title="Rezervasiyalarım"
        description="Rezervasiyalara baxmaq üçün daxil olun."
        loginHref={`/login?return=${encodeURIComponent("/my-houses/reservations")}`}
        registerHref={`/register?return=${encodeURIComponent("/my-houses/reservations")}`}
        backHref="/"
        backLabel="Ana səhifə"
      />
    );
  }

  return (
    <div className="owner-panel">
      <div className="container">
        <div className="owner-panel-section owner-panel-card">
          <div className="owner-panel-section-head">
            <div>
              <Link href="/my-houses" className="admin-detail-back" style={{ display: "inline-flex", gap: 8, marginBottom: 8 }}>
                <ArrowLeft size={16} aria-hidden />
                Ev sahibi panelinə qayıt
              </Link>
              <h1 style={{ margin: 0, fontSize: 28 }}>Rezervasiyalarım</h1>
              <p className="owner-panel-empty" style={{ marginTop: 6, padding: 0 }}>
                Bütün keçmiş və aktiv rezervasiyalar, statuslarla birlikdə.
              </p>
            </div>
            <span>{filtered.length} / {bookings.length}</span>
          </div>

          <div className="admin-toolbar" style={{ marginBottom: 16 }}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Hamısı</option>
              <option value="awaiting">Təsdiq gözləyir</option>
              <option value="approved">Təsdiqlənib</option>
              <option value="cancelled">Ləğv edilib</option>
            </select>
          </div>

          {error ? <div className="alert alert-error">{error}</div> : null}

          {filtered.length === 0 ? (
            <div className="owner-inbox-empty">
              <CalendarCheck size={22} aria-hidden />
              <p>Bu filter üzrə rezervasiya yoxdur.</p>
            </div>
          ) : (
            <div className="messages-list">
              {filtered.map((b) => (
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
                        b.status === "approved" ? " admin-badge--ok" : ""
                      }${
                        b.status === "pending" || b.status === "payment_pending"
                          ? " admin-badge--warn"
                          : ""
                      }`}
                    >
                      {statusLabel(b.status)}
                    </span>
                    <span className="admin-badge admin-badge--muted">{paymentLabel(b.payment_status)}</span>
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
                        <MessageCircle size={16} aria-hidden />
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
      </div>
    </div>
  );
}
