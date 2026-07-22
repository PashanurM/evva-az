"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { Property } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

interface BookingPageClientProps {
  property: Property | null;
}

export function BookingPageClient({ property }: BookingPageClientProps) {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(String(property?.guests ?? 2));
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      router.push(`/login?return=${encodeURIComponent(`/booking?property_id=${property?.id || ""}`)}`);
      return;
    }
    if (!property?.id) {
      setError(t("booking.selectPropertyFirst"));
      return;
    }
    if (!checkIn || !checkOut) {
      setError("Giriş və çıxış tarixlərini seçin.");
      return;
    }

    setBusy(true);
    const res = await api.createBooking({
      property_id: property.id,
      check_in: checkIn,
      check_out: checkOut,
      guest_count: Math.max(1, Number(guests) || 1),
      note: note.trim(),
      guest_name: user.full_name || user.username,
      guest_phone: user.phone,
    });
    setBusy(false);

    if (!res.success || !res.data) {
      setError(res.error || "Rezerv göndərilmədi");
      return;
    }

    setSuccess(res.data.message || "Rezerv sorğunuz göndərildi");
    if (res.data.conversation_id) {
      setTimeout(() => {
        router.push(`/chat?conversation_id=${res.data!.conversation_id}&property_id=${property.id}`);
      }, 800);
    }
  }

  if (authLoading) {
    return (
      <div className="auth-shell">
        <div className="auth-card"><p>{t("common.wait")}</p></div>
      </div>
    );
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <span className="section-kicker">{t("booking.title")}</span>
        <h1>{t("booking.bookAction")}</h1>
        {property ? (
          <p>
            <strong>{property.title}</strong> — {property.price} {t("common.perNight")}
          </p>
        ) : (
          <p>{t("booking.selectPropertyFirst")}</p>
        )}

        {error ? <div className="alert alert-error">{error}</div> : null}
        {success ? <div className="alert alert-success">{success}</div> : null}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="checkin">{t("booking.checkIn")}</label>
            <input
              id="checkin"
              name="checkin"
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="checkout">{t("booking.checkOut")}</label>
            <input
              id="checkout"
              name="checkout"
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="guests">{t("booking.guestCount")}</label>
            <input
              id="guests"
              name="guests"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor="note">{t("booking.note")}</label>
            <input
              id="note"
              name="note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("booking.notePlaceholder")}
            />
          </div>
          <button type="submit" className="auth-submit" disabled={busy || !property}>
            <CalendarCheck size={18} style={{ display: "inline", marginRight: 8 }} />
            {busy ? t("common.wait") : t("booking.submit")}
          </button>
        </form>
        {!user ? (
          <div className="auth-links">
            <Link href={`/login?return=/booking${property ? `?property_id=${property.id}` : ""}`}>
              {t("common.login")}
            </Link>
          </div>
        ) : null}
        {!property ? (
          <div className="auth-links">
            <Link href="/#properties">{t("common.browseHomes")}</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
