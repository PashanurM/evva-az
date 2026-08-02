"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgePercent, MapPin, UtensilsCrossed } from "lucide-react";
import { PlaceCard } from "@/components/places/PlaceCard";
import { placePath, restaurantPath } from "@/lib/slug";
import type { Place, PlaceCampaign } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

interface DayRoutePlace {
  id: number;
  title: string;
  slug: string;
  location: string;
  cover_url: string;
}

interface DayRouteRestaurant {
  id: number;
  name: string;
  slug: string;
  location: string;
}

interface CampaignCard {
  id: number;
  title: string;
  slug: string;
  location: string;
  cover_url: string;
  campaign: PlaceCampaign;
}

interface PlacesPageClientProps {
  places: Place[];
  categories: string[];
  filters: {
    q?: string;
    category?: string;
    sort: string;
  };
  campaigns?: CampaignCard[];
  dayRoute?: {
    places: DayRoutePlace[];
    restaurant: DayRouteRestaurant | null;
  };
}

function formatUntil(until: string | null | undefined, label: string) {
  if (!until) return null;
  try {
    const date = new Date(`${until}T00:00:00`);
    if (Number.isNaN(date.getTime())) return null;
    return `${label} ${date.toLocaleDateString()}`;
  } catch {
    return null;
  }
}

export function PlacesPageClient({
  places,
  categories,
  filters,
  campaigns = [],
  dayRoute,
}: PlacesPageClientProps) {
  const { t } = useLocale();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-kicker">{t("places.kicker")}</span>
          <h1>{t("places.title")}</h1>
          <p>{t("places.subtitle")}</p>
          <form className="page-filters" method="get">
            <input
              name="q"
              defaultValue={filters.q || ""}
              placeholder={t("places.searchPlaceholder")}
            />
            <select name="category" defaultValue={filters.category || ""}>
              <option value="">{t("places.allCategories")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select name="sort" defaultValue={filters.sort}>
              <option value="featured">{t("places.sortFeatured")}</option>
              <option value="rating">{t("places.sortRating")}</option>
            </select>
            <button type="submit" className="search-btn">
              {t("common.search")}
            </button>
            <Link href="/places" className="reset-search-btn">
              {t("common.reset")}
            </Link>
          </form>
        </div>
      </section>

      {campaigns.length > 0 ? (
        <section className="places-campaigns">
          <div className="container">
            <span className="section-kicker">{t("places.campaignsKicker")}</span>
            <h2>{t("places.campaignsTitle")}</h2>
            <p>{t("places.campaignsText")}</p>
            <div className="places-campaigns-track">
              {campaigns.map((item) => {
                const untilLabel = formatUntil(item.campaign.until, t("places.campaignUntil"));
                return (
                  <article key={item.id} className="places-campaign-card">
                    <div className="places-campaign-media">
                      {item.cover_url && !item.cover_url.endsWith("no-image.svg") ? (
                        <Image
                          src={item.cover_url}
                          alt={item.title}
                          width={420}
                          height={240}
                          unoptimized
                        />
                      ) : (
                        <BadgePercent size={40} aria-hidden />
                      )}
                      {item.campaign.badge ? (
                        <span className="place-campaign-badge">{item.campaign.badge}</span>
                      ) : null}
                    </div>
                    <div className="places-campaign-body">
                      <strong>{item.campaign.title}</strong>
                      <p>{item.campaign.text || item.title}</p>
                      <span className="places-campaign-meta">
                        <MapPin size={12} aria-hidden /> {item.location}
                        {untilLabel ? ` · ${untilLabel}` : ""}
                      </span>
                      <Link href={placePath(item)} className="auth-btn primary places-campaign-cta">
                        {t("places.campaignCta")}
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {dayRoute && dayRoute.places.length > 0 ? (
        <section className="places-day-route">
          <div className="container">
            <span className="section-kicker">{t("places.dayRouteKicker")}</span>
            <h2>{t("places.dayRouteTitle")}</h2>
            <p>{t("places.dayRouteText")}</p>
            <ol className="day-route-list">
              {dayRoute.places.map((place, index) => (
                <li key={place.id}>
                  <span className="day-route-step">{index + 1}</span>
                  <Link href={placePath(place)} className="day-route-card">
                    <div className="day-route-media">
                      {place.cover_url && !place.cover_url.endsWith("no-image.svg") ? (
                        <Image
                          src={place.cover_url}
                          alt={place.title}
                          width={120}
                          height={80}
                          unoptimized
                        />
                      ) : (
                        <MapPin size={24} aria-hidden />
                      )}
                    </div>
                    <div>
                      <strong>{place.title}</strong>
                      <p>
                        <MapPin size={12} aria-hidden /> {place.location}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            {dayRoute.restaurant ? (
              <div className="day-route-tip">
                <UtensilsCrossed size={18} aria-hidden />
                <p>
                  {t("places.dayRouteTip")}{" "}
                  <Link href={restaurantPath(dayRoute.restaurant)}>
                    {dayRoute.restaurant.name}
                  </Link>
                  {" "}({dayRoute.restaurant.location})
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section style={{ padding: "0 0 24px" }}>
        <div className="container">
          <div className="section-intro-wrap" style={{ marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>{t("places.popular")}</h2>
            <Link href="/places" style={{ fontWeight: 800, color: "var(--primary)", display: "flex", alignItems: "center", gap: 6 }}>
              {t("places.viewAll")} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="properties" style={{ paddingTop: 0 }}>
        <div className="container catalog-grid">
          {places.length === 0 ? (
            <div className="no-results" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
              <p>{t("places.empty")}</p>
            </div>
          ) : (
            places.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))
          )}
        </div>
      </section>

      <section style={{ padding: "24px 0 60px" }}>
        <div className="container">
          <div className="discover-card" style={{ marginBottom: 20 }}>
            <h2>{t("places.showcaseTitle")}</h2>
            <p>{t("places.showcaseText")}</p>
          </div>
        </div>
      </section>
    </>
  );
}
