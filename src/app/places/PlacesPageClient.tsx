"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PlaceCard } from "@/components/places/PlaceCard";
import type { Place } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

interface PlacesPageClientProps {
  places: Place[];
  categories: string[];
  filters: {
    q?: string;
    category?: string;
    sort: string;
  };
}

export function PlacesPageClient({
  places,
  categories,
  filters,
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
