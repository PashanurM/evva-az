"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Users,
  DoorOpen,
  Bath,
  MessageCircle,
  CalendarCheck,
  ChevronRight,
  CalendarPlus,
  Eye,
  Bed,
  Moon,
  Clock3,
  UserRound,
} from "lucide-react";
import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";
import { AvailabilityCalendar } from "@/components/property/AvailabilityCalendar";
import { PropertyGallery } from "@/components/property/PropertyGallery";

interface PropertyDetailClientProps {
  property: Property;
  mapsUrl: string;
  gallery: string[];
}

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

/** Stable SSR/client date label — avoids Intl locale mismatches. */
function formatPropertyDate(value?: string): string {
  if (!value) return "";
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  if (month < 0 || month > 11 || day < 1) return "";
  return `${day} ${AZ_MONTHS[month]} ${year}`;
}

export function PropertyDetailClient({
  property,
  mapsUrl,
  gallery,
}: PropertyDetailClientProps) {
  const { t } = useLocale();
  const createdDate = formatPropertyDate(property.createdAt);
  const ownerInitial = (property.owner?.name || property.owner?.username || "E")
    .trim()
    .charAt(0)
    .toLocaleUpperCase("az");

  return (
    <section className="property-shell">
      <div className="container">
        <nav className="crumbs">
          <Link href="/">{t("common.home")}</Link>
          <ChevronRight size={14} />
          <span>{property.title}</span>
        </nav>

        <div className="property-hero">
          <div className="glass gallery-card">
            <PropertyGallery images={gallery} title={property.title} />
          </div>

          <div className="glass property-hero-panel">
            <div className="headline">
              <h1>{property.title}</h1>
              <div className="price-pill">
                {property.price} ₼ <small>{t("property.perNightSuffix")}</small>
              </div>
              <div className="loc-row">
                <MapPin size={16} /> {property.location}
              </div>

              {property.owner?.name || property.owner?.username ? (
                <div className="property-owner-card">
                  <span className="property-owner-avatar">
                    {property.owner.profileImage ? (
                      <Image
                        src={property.owner.profileImage}
                        alt={property.owner.name || property.owner.username}
                        width={52}
                        height={52}
                        unoptimized
                      />
                    ) : (
                      ownerInitial
                    )}
                  </span>
                  <span className="property-owner-copy">
                    <small>Ev sahibi</small>
                    <strong>{property.owner.name || property.owner.username}</strong>
                    {property.owner.username ? <span>@{property.owner.username}</span> : null}
                  </span>
                </div>
              ) : null}

              <div className="property-detail-meta">
                {createdDate ? (
                  <span>
                    <CalendarPlus size={15} /> {createdDate}
                  </span>
                ) : null}
                {property.owner?.username ? (
                  <span>
                    <UserRound size={15} /> @{property.owner.username}
                  </span>
                ) : null}
              </div>

              <div className="stats-grid detail-primary-stats">
                <div className="stat-box">
                  <Users size={20} style={{ margin: "0 auto 8px" }} />
                  <strong>{property.guests}</strong>
                  <span>{t("property.guestLabel")}</span>
                </div>
                <div className="stat-box">
                  <DoorOpen size={20} style={{ margin: "0 auto 8px" }} />
                  <strong>{property.rooms}</strong>
                  <span>{t("property.roomLabel")}</span>
                </div>
                <div className="stat-box">
                  <Bath size={20} style={{ margin: "0 auto 8px" }} />
                  <strong>{property.bathrooms}</strong>
                  <span>{t("property.bathLabel")}</span>
                </div>
              </div>

              <div className="property-detail-meta property-detail-meta--secondary">
                <span>
                  <Eye size={15} /> {property.views} baxış
                </span>
                <span>
                  <Bed size={15} /> {property.singleBeds ?? 0} tək yataq
                </span>
                <span>
                  <Bed size={15} /> {property.doubleBeds ?? 0} iki nəfərlik yataq
                </span>
                {(property.sofaBeds ?? 0) > 0 ? (
                  <span>
                    <Bed size={15} /> {property.sofaBeds} divan yataq
                  </span>
                ) : null}
                <span>
                  <Moon size={15} /> min. {property.minimumNights ?? 1} gecə
                </span>
                <span>
                  <Clock3 size={15} /> {property.checkInTime || "15:00"} /{" "}
                  {property.checkOutTime || "12:00"}
                </span>
              </div>

              <div className="card-tags">
                {property.tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="cta-grid cta-grid--actions">
              <Link
                href={`/chat?property_id=${property.id}`}
                className="contact-btn"
                aria-label={t("common.message")}
              >
                <MessageCircle size={18} aria-hidden />
                <span className="btn-label">{t("common.message")}</span>
              </Link>
              <Link
                href={`/booking?property_id=${property.id}`}
                className="reserve-btn"
                aria-label={t("common.reserve")}
              >
                <CalendarCheck size={18} aria-hidden />
                <span className="btn-label">{t("common.reserve")}</span>
              </Link>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="view-btn"
                aria-label={t("common.viewOnMap")}
              >
                <MapPin size={18} aria-hidden />
                <span className="btn-label">{t("common.viewOnMap")}</span>
              </a>
            </div>
          </div>
        </div>

        <section className="glass section-block">
          <div className="section-title">
            <h2>{t("property.about")}</h2>
          </div>
          <div className="rich-copy">
            {(property.description || "").slice(0, 2000)}
          </div>
        </section>

        <section className="glass section-block">
          <div className="section-title">
            <h2>{t("property.bookedDays")}</h2>
            <div style={{ fontSize: 13, opacity: 0.72 }}>{t("property.bookingsNote")}</div>
          </div>
          <AvailabilityCalendar occupiedRanges={property.occupiedRanges || []} />
        </section>
      </div>
    </section>
  );
}
