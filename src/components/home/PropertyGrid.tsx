"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import type { Property } from "@/types";
import { PropertyCard } from "./PropertyCard";
import { useLocale } from "@/providers/LocaleProvider";

export function PropertyGrid({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();

  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const hasDateFilter = Boolean(checkIn && checkOut && checkOut > checkIn);

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`/?${params.toString()}#properties`);
  }

  return (
    <>
      <section className="section-intro">
        <div className="container section-intro-wrap">
          <div>
            <span className="section-kicker">{t("home.featuredListings")}</span>
            <div className="results-badge">
              <Star size={16} />
              <span>{t("common.results", { count: properties.length })}</span>
            </div>
            {hasDateFilter ? (
              <p className="availability-filter-note">
                {t("home.availableFilterNote", { from: checkIn, to: checkOut })}
              </p>
            ) : null}
          </div>
          <form className="sort-form-modern">
            <label htmlFor="sort">{t("common.sortLabel")}</label>
            <select
              name="sort"
              id="sort"
              defaultValue={searchParams.get("sort") ?? "newest"}
              onChange={handleSort}
            >
              <option value="newest">{t("home.sortNewest")}</option>
              <option value="price_desc">{t("home.sortPriceDesc")}</option>
              <option value="price_asc">{t("home.sortPriceAsc")}</option>
              <option value="views_desc">{t("home.sortViews")}</option>
              <option value="rating_desc">{t("home.sortRating")}</option>
            </select>
          </form>
        </div>
      </section>

      <section className="properties" id="properties">
        <div className="container">
          {properties.length === 0 ? (
            <div className="no-results" style={{ textAlign: "center", padding: "80px 20px" }}>
              <p>
                {hasDateFilter ? t("home.noAvailableResults") : t("home.noResults")}
              </p>
            </div>
          ) : (
            <div className="properties-grid">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
