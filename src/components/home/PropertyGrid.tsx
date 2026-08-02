"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GitCompare, Star } from "lucide-react";
import type { Property } from "@/types";
import { PropertyCard } from "./PropertyCard";
import { useLocale } from "@/providers/LocaleProvider";
import { useAuth } from "@/providers/AuthProvider";
import { api } from "@/lib/api";

const MAX_COMPARE = 3;

export function PropertyGrid({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const { user } = useAuth();
  const [items, setItems] = useState(properties);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  useEffect(() => {
    setItems(properties);
  }, [properties]);

  useEffect(() => {
    if (!user) {
      setItems((prev) => prev.map((p) => ({ ...p, isFavorite: false })));
      return;
    }

    let active = true;
    void api.getFavorites().then((res) => {
      if (!active || !res.success) return;
      const ids = new Set((res.data?.items || []).map((row) => Number(row.id)));
      setItems((prev) =>
        prev.map((p) => ({
          ...p,
          isFavorite: ids.has(p.id),
        })),
      );
    });

    return () => {
      active = false;
    };
  }, [user]);

  const checkIn = searchParams.get("check_in") || "";
  const checkOut = searchParams.get("check_out") || "";
  const hasDateFilter = Boolean(checkIn && checkOut && checkOut > checkIn);

  function handleSort(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    router.push(`/homes?${params.toString()}#properties`);
  }

  function toggleCompareMode() {
    setCompareMode((current) => {
      if (current) setSelectedIds([]);
      return !current;
    });
  }

  function toggleSelect(id: number) {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((row) => row !== id);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, id];
    });
  }

  function openCompare() {
    if (selectedIds.length < 2) return;
    router.push(`/compare?ids=${selectedIds.join(",")}`);
  }

  return (
    <>
      <section className="section-intro">
        <div className="container section-intro-wrap">
          <div>
            <span className="section-kicker">{t("home.featuredListings")}</span>
            <div className="results-badge">
              <Star size={16} />
              <span>{t("common.results", { count: items.length })}</span>
            </div>
            {hasDateFilter ? (
              <p className="availability-filter-note">
                {t("home.availableFilterNote", { from: checkIn, to: checkOut })}
              </p>
            ) : null}
          </div>
          <div className="section-intro-actions">
            <button
              type="button"
              className={`compare-mode-btn${compareMode ? " is-on" : ""}`}
              onClick={toggleCompareMode}
            >
              <GitCompare size={16} aria-hidden />
              {t("compare.toggle")}
            </button>
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
        </div>
      </section>

      <section className="properties" id="properties">
        <div className="container">
          {items.length === 0 ? (
            <div className="no-results" style={{ textAlign: "center", padding: "80px 20px" }}>
              <p>
                {hasDateFilter ? t("home.noAvailableResults") : t("home.noResults")}
              </p>
            </div>
          ) : (
            <div className="properties-grid">
              {items.map((property) => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  selectable={compareMode}
                  selected={selectedIds.includes(property.id)}
                  onSelectToggle={toggleSelect}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {compareMode && selectedIds.length > 0 ? (
        <div className="compare-sticky-bar">
          <div className="container compare-sticky-inner">
            <span>{t("compare.selectedCount", { count: selectedIds.length })}</span>
            <button
              type="button"
              className="hub-cta hub-cta--primary"
              disabled={selectedIds.length < 2}
              onClick={openCompare}
            >
              {t("compare.viewCompare")}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
