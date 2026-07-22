"use client";

import Link from "next/link";
import Image from "next/image";
import { Crown, Star, UtensilsCrossed } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export interface RestaurantListItem {
  id: number;
  title: string;
  location: string;
  premium: boolean;
  rating?: number;
  image: string;
}

interface RestaurantsPageClientProps {
  restaurants: RestaurantListItem[];
  locations: string[];
  filters: {
    q?: string;
    location?: string;
    sort: string;
  };
}

export function RestaurantsPageClient({
  restaurants,
  locations,
  filters,
}: RestaurantsPageClientProps) {
  const { t } = useLocale();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <span className="section-kicker">{t("restaurants.kicker")}</span>
          <h1>{t("restaurants.title")}</h1>
          <p>{t("restaurants.subtitle")}</p>
          <form className="page-filters" method="get">
            <input
              name="q"
              defaultValue={filters.q || ""}
              placeholder={t("restaurants.searchPlaceholder")}
            />
            <select name="location" defaultValue={filters.location || ""}>
              <option value="">{t("restaurants.allLocations")}</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
            <select name="sort" defaultValue={filters.sort}>
              <option value="featured">{t("restaurants.sortFeatured")}</option>
              <option value="rating">{t("restaurants.sortRating")}</option>
            </select>
            <button type="submit" className="search-btn">
              {t("common.search")}
            </button>
            <Link href="/restaurants" className="reset-search-btn">
              {t("common.reset")}
            </Link>
          </form>
        </div>
      </section>

      <section className="properties" style={{ paddingTop: 0 }}>
        <div className="container catalog-grid">
          {restaurants.length === 0 ? (
            <div className="no-results" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}>
              <p>{t("restaurants.empty")}</p>
            </div>
          ) : (
            restaurants.map((restaurant) => (
              <Link key={restaurant.id} href={`/restaurants/${restaurant.id}`} className="catalog-card">
                <div className="catalog-card-image">
                  {restaurant.image && !restaurant.image.endsWith("no-image.svg") ? (
                    <Image
                      src={restaurant.image}
                      alt={restaurant.title}
                      width={400}
                      height={200}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      unoptimized
                    />
                  ) : (
                    <UtensilsCrossed size={48} />
                  )}
                </div>
                <div className="catalog-card-body">
                  {restaurant.premium && (
                    <span className="premium-label">
                      <Crown size={12} /> {t("common.premium")}
                    </span>
                  )}
                  <h2>{restaurant.title}</h2>
                  <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                    {restaurant.location}
                  </p>
                  <p style={{ color: "var(--text-muted)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} /> {restaurant.rating?.toFixed(1) ?? "0.0"} / 10
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </>
  );
}
