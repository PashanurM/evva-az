"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Clock, MapPin, Phone, Star } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export interface RestaurantDetailData {
  id: number;
  name: string;
  location: string;
  address?: string;
  opening_hours?: string;
  phone?: string;
  average_price?: number;
  avg_rating: number;
  rating_count: number;
  is_featured: boolean;
  description?: string;
  short_description?: string;
  cuisine_tags?: string;
  cover: string;
}

interface RestaurantDetailClientProps {
  restaurant: RestaurantDetailData;
}

export function RestaurantDetailClient({ restaurant }: RestaurantDetailClientProps) {
  const { t } = useLocale();
  const cover = restaurant.cover;

  return (
    <section className="place-detail">
      <div className="container">
        <div className="place-detail-topbar">
          <nav className="crumbs" style={{ margin: 0 }}>
            <Link href="/">{t("common.home")}</Link>
            <ChevronRight size={14} />
            <Link href="/restaurants">{t("nav.restaurants")}</Link>
            <ChevronRight size={14} />
            <span>{restaurant.name}</span>
          </nav>
        </div>

        <section className="place-hero">
          <div className="place-hero-meta">
            <span className="place-hero-kicker">
              <Star size={14} /> {restaurant.avg_rating.toFixed(1)} / 10 •{" "}
              {t("common.votes", { count: restaurant.rating_count })}
            </span>
            {restaurant.is_featured ? (
              <span className="premium-label">{t("common.premium")}</span>
            ) : null}
          </div>
          <h1>{restaurant.name}</h1>
          <p className="place-hero-loc">
            <MapPin size={16} /> {restaurant.location}
          </p>
        </section>

        {cover && !cover.endsWith("no-image.svg") && (
          <div className="catalog-card-image" style={{ borderRadius: 24, overflow: "hidden", marginBottom: 24, minHeight: 280 }}>
            <Image
              src={cover}
              alt={restaurant.name}
              width={1200}
              height={420}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              unoptimized
            />
          </div>
        )}

        <section className="place-info-grid">
          <div className="place-info-box">
            <h2>{t("restaurants.about")}</h2>
            <p>{restaurant.description || restaurant.short_description}</p>
            {restaurant.cuisine_tags && (
              <span className="tag" style={{ marginTop: 12 }}>
                {restaurant.cuisine_tags}
              </span>
            )}
          </div>

          <aside className="place-info-box">
            <h3>{t("common.details")}</h3>
            <dl className="place-details-list">
              <div>
                <dt>{t("common.location")}</dt>
                <dd>{restaurant.location}</dd>
              </div>
              {restaurant.address && (
                <div>
                  <dt>{t("common.address")}</dt>
                  <dd>{restaurant.address}</dd>
                </div>
              )}
              {restaurant.opening_hours && (
                <div>
                  <dt>
                    <Clock size={14} style={{ display: "inline", marginRight: 4 }} />
                    {t("common.hours")}
                  </dt>
                  <dd>{restaurant.opening_hours}</dd>
                </div>
              )}
              {restaurant.phone && (
                <div>
                  <dt>
                    <Phone size={14} style={{ display: "inline", marginRight: 4 }} />
                    {t("common.phone")}
                  </dt>
                  <dd>{restaurant.phone}</dd>
                </div>
              )}
              {restaurant.average_price ? (
                <div>
                  <dt>{t("common.avgPrice")}</dt>
                  <dd>{restaurant.average_price} ₼</dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </section>
      </div>
    </section>
  );
}
