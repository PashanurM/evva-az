"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useState } from "react";
import {
  Crown,
  MapPin,
  Eye,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";
import { FavoriteToggle } from "@/components/property/FavoriteToggle";

export function PropertyCard({
  property,
  onFavoriteChange,
}: {
  property: Property;
  onFavoriteChange?: (favorite: boolean) => void;
}) {
  const { t } = useLocale();
  const [tipKey, setTipKey] = useState<string | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const viewLabel = t("common.viewMore");
  const messageLabel = t("common.message");
  const reserveLabel = t("common.reserve");

  function showTip(key: string) {
    setTipKey(key);
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setTipKey(null), 1600);
  }

  return (
    <div
      className={`property-card ${property.premium ? "premium-property-card" : ""}`}
      id={`property-${property.id}`}
    >
      <div className="card-image">
        <Link href={`/property/${property.id}`} className="card-image-link" tabIndex={-1}>
          <Image
            src={property.image}
            alt={property.title}
            width={400}
            height={270}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            unoptimized
          />
        </Link>
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
        <FavoriteToggle
          propertyId={property.id}
          initialFavorite={Boolean(property.isFavorite)}
          onChange={onFavoriteChange}
        />
      </div>

      <div className="card-content">
        <div className="card-topline">
          <h3>
            <Link href={`/property/${property.id}`}>{property.title}</Link>
          </h3>
        </div>

        <div className="card-actions card-actions-3">
          <Link
            href={`/property/${property.id}`}
            className={`view-btn${tipKey === "view" ? " is-tip-open" : ""}`}
            aria-label={viewLabel}
            title={viewLabel}
            data-tooltip={viewLabel}
            onPointerDown={() => showTip("view")}
          >
            <Eye size={16} aria-hidden />
            <span className="btn-label">{viewLabel}</span>
          </Link>
          <Link
            href={`/chat?property_id=${property.id}`}
            className={`contact-btn${tipKey === "msg" ? " is-tip-open" : ""}`}
            aria-label={messageLabel}
            title={messageLabel}
            data-tooltip={messageLabel}
            onPointerDown={() => showTip("msg")}
          >
            <MessageCircle size={16} aria-hidden />
            <span className="btn-label">{messageLabel}</span>
          </Link>
          <Link
            href={`/booking?property_id=${property.id}`}
            className={`reserve-btn${tipKey === "reserve" ? " is-tip-open" : ""}`}
            aria-label={reserveLabel}
            title={reserveLabel}
            data-tooltip={reserveLabel}
            onPointerDown={() => showTip("reserve")}
          >
            <CalendarCheck size={16} aria-hidden />
            <span className="btn-label">{reserveLabel}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
