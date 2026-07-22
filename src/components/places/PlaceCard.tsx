"use client";

import Link from "next/link";
import Image from "next/image";
import { Crown, MapPin, Star } from "lucide-react";
import type { Place } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

export function PlaceCard({ place }: { place: Place }) {
  const { t } = useLocale();
  const thumb = place.image ?? place.images?.[0];

  return (
    <Link href={`/places/${place.id}`} className="catalog-card place-card-link">
      <div className="catalog-card-image">
        {thumb ? (
          <Image
            src={thumb}
            alt={place.title}
            width={400}
            height={200}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            unoptimized
          />
        ) : (
          <MapPin size={48} />
        )}
      </div>
      <div className="catalog-card-body">
        {place.premium && (
          <span className="premium-label">
            <Crown size={12} /> {t("common.premium")}
          </span>
        )}
        <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>{place.title}</h3>
        <p style={{ color: "var(--text-secondary)", margin: "0 0 8px" }}>
          {place.description}
        </p>
        <p style={{ color: "var(--text-muted)", margin: "0 0 12px", fontSize: 13 }}>
          <MapPin size={12} style={{ display: "inline", marginRight: 4 }} />
          {place.location}
        </p>
        <span
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          {place.entryFee ?? t("common.free")} •{" "}
          <Star size={12} /> {place.rating?.toFixed(1) ?? "0.0"}
        </span>
        <div style={{ marginTop: 14 }}>
          <span className="auth-btn primary" style={{ display: "inline-flex" }}>
            {t("common.viewDetails")}
          </span>
        </div>
      </div>
    </Link>
  );
}
