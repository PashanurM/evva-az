"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Crown,
  MapPin,
  Eye,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

export function PropertyCard({ property }: { property: Property }) {
  const { t } = useLocale();

  return (
    <div
      className={`property-card ${property.premium ? "premium-property-card" : ""}`}
      id={`property-${property.id}`}
    >
      <Link href={`/property/${property.id}`} className="card-image">
        <Image
          src={property.image}
          alt={property.title}
          width={400}
          height={270}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          unoptimized
        />
        {property.premium && (
          <span className="premium-crown-badge" aria-label={t("property.featuredHome")}>
            <Crown size={18} />
          </span>
        )}
        <div className="card-badges">
          <span className="location-badge">
            <MapPin size={12} /> {property.location}
          </span>
          <span className="price-badge">
            {property.price} {t("common.perNight")}
          </span>
        </div>
      </Link>

      <div className="card-content">
        <div className="card-topline">
          <h3>{property.title}</h3>
        </div>

        <div className="card-actions card-actions-3">
          <Link href={`/property/${property.id}`} className="view-btn" aria-label={t("common.viewMore")}>
            <Eye size={16} aria-hidden />
            <span className="btn-label">{t("common.viewMore")}</span>
          </Link>
          <Link href={`/chat?property_id=${property.id}`} className="contact-btn" aria-label={t("common.message")}>
            <MessageCircle size={16} aria-hidden />
            <span className="btn-label">{t("common.message")}</span>
          </Link>
          <Link href={`/booking?property_id=${property.id}`} className="reserve-btn" aria-label={t("common.reserve")}>
            <CalendarCheck size={16} aria-hidden />
            <span className="btn-label">{t("common.reserve")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
