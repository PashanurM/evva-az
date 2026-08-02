"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  MapPin,
  Moon,
  Users,
  BedDouble,
  Bath,
} from "lucide-react";
import { api } from "@/lib/api";
import type { Property } from "@/types";
import { DateInput } from "@/components/ui/DateInput";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

interface BookingPageClientProps {
  property: Property | null;
}

function toIsoToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftIso(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function stayCrossesOccupied(
  checkIn: string,
  checkOut: string,
  ranges: Array<{ check_in: string; check_out: string }>,
): boolean {
  if (!checkIn || !checkOut || checkOut <= checkIn) return false;
  for (const range of ranges) {
    if (checkIn < range.check_out && checkOut > range.check_in) return true;
  }
  return false;
}

export function BookingPageClient({ property }: BookingPageClientProps) {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(String(property?.guests ?? 2));
  const [note, setNote] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const occupiedRanges = property?.occupiedRanges || [];

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(`${checkIn}T12:00:00`);
    const end = new Date(`${checkOut}T12:00:00`);
    const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
    return diff > 0 ? diff : 0;
  }, [checkIn, checkOut]);

  const estimatedTotal =
    property && nights > 0 ? property.price * nights : null;

  function handleCheckInChange(value: string) {
    setCheckIn(value);
    if (checkOut && (checkOut <= value || stayCrossesOccupied(value, checkOut, occupiedRanges))) {
      setCheckOut("");
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!user) {
      router.push(
        `/login?return=${encodeURIComponent(`/booking?property_id=${property?.id || ""}`)}`,
      );
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
    if (stayCrossesOccupied(checkIn, checkOut, occupiedRanges)) {
      setError("Seçilmiş tarixlər dolu günlərlə üst-üstə düşür. Başqa tarix seçin.");
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
      ...(referralCode.trim() ? { referral_code: referralCode.trim() } : {}),
    });
    setBusy(false);

    if (!res.success || !res.data) {
      setError(res.error || "Rezerv göndərilmədi");
      return;
    }

    setSuccess(res.data.message || "Rezerv sorğunuz göndərildi");
    if (res.data.conversation_id) {
      setTimeout(() => {
        router.push(
          `/chat?conversation_id=${res.data!.conversation_id}&property_id=${property.id}`,
        );
      }, 800);
    }
  }

  if (authLoading) {
    return (
      <div className="booking-shell">
        <div className="booking-panel booking-panel--loading">
          <p>{t("common.wait")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-shell">
      <div className="booking-panel">
        <aside className="booking-aside">
          {property?.image ? (
            <div className="booking-aside-media">
              <Image
                src={property.image}
                alt={property.title}
                fill
                sizes="(max-width: 900px) 100vw, 420px"
                className="booking-aside-image"
                priority
                unoptimized
              />
            </div>
          ) : (
            <div className="booking-aside-media booking-aside-media--empty" />
          )}

          <div className="booking-aside-body">
            <span className="section-kicker">{t("booking.title")}</span>
            {property ? (
              <>
                <h1 className="booking-aside-title">{property.title}</h1>
                {property.location ? (
                  <p className="booking-aside-location">
                    <MapPin size={16} aria-hidden />
                    <span>{property.location}</span>
                  </p>
                ) : null}
                <div className="booking-aside-price">
                  <strong>{property.price}</strong>
                  <span>{t("common.perNight")}</span>
                </div>
                <ul className="booking-aside-meta">
                  <li>
                    <Users size={16} aria-hidden />
                    <span>
                      {property.guests} {t("booking.guestCount").toLowerCase()}
                    </span>
                  </li>
                  {property.rooms > 0 ? (
                    <li>
                      <BedDouble size={16} aria-hidden />
                      <span>{property.rooms}</span>
                    </li>
                  ) : null}
                  {property.bathrooms > 0 ? (
                    <li>
                      <Bath size={16} aria-hidden />
                      <span>{property.bathrooms}</span>
                    </li>
                  ) : null}
                </ul>
              </>
            ) : (
              <>
                <h1 className="booking-aside-title">{t("booking.bookAction")}</h1>
                <p className="booking-aside-copy">
                  {t("booking.selectPropertyFirst")}
                </p>
                <Link href="/homes#properties" className="booking-aside-link">
                  {t("common.browseHomes")}
                </Link>
              </>
            )}
          </div>
        </aside>

        <section className="booking-form-side">
          <header className="booking-form-head">
            <span className="section-kicker booking-form-kicker">
              {t("booking.title")}
            </span>
            <h2>{t("booking.bookAction")}</h2>
            <p>
              {property
                ? `${property.title} — ${property.price} ${t("common.perNight")}`
                : t("booking.selectPropertyFirst")}
            </p>
          </header>

          {error ? <div className="alert alert-error">{error}</div> : null}
          {success ? <div className="alert alert-success">{success}</div> : null}

          <form className="booking-form" onSubmit={handleSubmit}>
            <div className="booking-form-row">
              <div className="form-field">
                <label htmlFor="checkin">{t("booking.checkIn")}</label>
                <DateInput
                  id="checkin"
                  name="checkin"
                  value={checkIn}
                  onChange={handleCheckInChange}
                  min={toIsoToday()}
                  max={checkOut ? shiftIso(checkOut, -1) : undefined}
                  occupiedRanges={occupiedRanges}
                  required
                  placeholder={t("booking.checkIn")}
                  aria-label={t("booking.checkIn")}
                />
              </div>
              <div className="form-field">
                <label htmlFor="checkout">{t("booking.checkOut")}</label>
                <DateInput
                  id="checkout"
                  name="checkout"
                  value={checkOut}
                  onChange={setCheckOut}
                  min={checkIn ? shiftIso(checkIn, 1) : shiftIso(toIsoToday(), 1)}
                  occupiedRanges={occupiedRanges}
                  rangeStart={checkIn || undefined}
                  required
                  placeholder={t("booking.checkOut")}
                  aria-label={t("booking.checkOut")}
                />
              </div>
            </div>

            <div className="booking-form-row booking-form-row--guests">
              <div className="form-field">
                <label htmlFor="guests">{t("booking.guestCount")}</label>
                <input
                  id="guests"
                  name="guests"
                  type="number"
                  min={1}
                  max={property?.guests || undefined}
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                />
              </div>
              {nights > 0 ? (
                <div className="booking-nights-chip" aria-live="polite">
                  <Moon size={16} aria-hidden />
                  <span>
                    {nights} gecə
                    {estimatedTotal != null ? ` · ${estimatedTotal} ₼` : ""}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="form-field">
              <label htmlFor="note">{t("booking.note")}</label>
              <textarea
                id="note"
                name="note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("booking.notePlaceholder")}
                className="booking-note"
              />
            </div>

            <div className="form-field">
              <label htmlFor="referral_code">{t("booking.referralCode")}</label>
              <input
                id="referral_code"
                name="referral_code"
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder={t("booking.referralCodePlaceholder")}
                autoComplete="off"
              />
            </div>

            <button
              type="submit"
              className="auth-submit booking-submit"
              disabled={busy || !property}
            >
              <CalendarCheck size={18} aria-hidden />
              {busy ? t("common.wait") : t("booking.submit")}
            </button>

            {property ? (
              <div className="booking-admin-help">
                <p>{t("booking.adminHelpText")}</p>
                <a
                  href={`https://wa.me/994554440830?text=${encodeURIComponent(
                    `${property.title} (${property.id}) - ${t("booking.adminHelpWhatsapp")}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="booking-admin-help-btn"
                >
                  {t("booking.adminHelpButton")}
                </a>
              </div>
            ) : null}
          </form>

          {!property ? (
            <div className="auth-links booking-links">
              <Link href="/homes#properties">{t("common.browseHomes")}</Link>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
