"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Home,
  Star,
  MapPin,
  Banknote,
  DoorOpen,
  Bath,
  SlidersHorizontal,
  Search,
  RotateCcw,
  CalendarDays,
} from "lucide-react";
import { filterTags, locations } from "@/lib/data/properties";
import { useLocale } from "@/providers/LocaleProvider";

interface SearchBoxProps {
  totalCount: number;
  locations?: string[];
  filterTags?: string[];
}

export function SearchBox({
  totalCount,
  locations: locationOptions = locations,
  filterTags: tagOptions = filterTags,
}: SearchBoxProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [isPending, startTransition] = useTransition();
  const [showExtra, setShowExtra] = useState(false);

  const selectedTags = searchParams.getAll("tags");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const params = new URLSearchParams();

    const fields = [
      "location",
      "min_price",
      "max_price",
      "min_rooms",
      "min_bathrooms",
      "search",
      "check_in",
      "check_out",
    ] as const;

    for (const field of fields) {
      const val = form.get(field)?.toString();
      if (val) params.set(field, val);
    }

    const checkIn = form.get("check_in")?.toString() || "";
    const checkOut = form.get("check_out")?.toString() || "";
    if (checkIn && !checkOut) {
      params.delete("check_in");
    } else if (!checkIn && checkOut) {
      params.delete("check_out");
    } else if (checkIn && checkOut && checkOut <= checkIn) {
      params.delete("check_out");
      params.delete("check_in");
    }

    form.getAll("tags").forEach((tag) => {
      if (tag) params.append("tags", tag.toString());
    });

    startTransition(() => {
      router.push(`/?${params.toString()}#properties`);
    });
  }

  function handleReset() {
    setShowExtra(false);
    startTransition(() => {
      router.replace("/#properties");
      router.refresh();
    });
  }

  return (
    <section className="hero">
      <div className="hero-blur hero-blur-left" />
      <div className="hero-blur hero-blur-right" />

      <div className="container hero-layout">
        <div className="hero-nature-intro">
          <span className="section-kicker">{t("home.kicker")}</span>
          <h2 className="hero-nature-title">{t("home.heroTitle")}</h2>
        </div>
        <div className="search-box search-box-premium">
          <div className="search-box-head">
            <div className="search-box-copy">
              <h3>{t("home.searchTitle")}</h3>
              <p>{t("home.searchSubtitle")}</p>
            </div>
            <div className="hero-mini-info">
              <span className="hero-mini-pill">
                <Home size={14} aria-hidden /> {t("common.activeListings", { count: totalCount })}
              </span>
              <span className="hero-mini-pill hero-mini-pill--secondary">
                <Star size={14} aria-hidden /> {t("home.featuredVillas")}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} id="searchForm" key={searchParams.toString()}>
            <div className="evva-filter-core evva-filter-core-simple">
              <label className="premium-select-wrap filter-location-main search-field">
                <span className="search-field-label">{t("home.selectLocation")}</span>
                <span className="search-field-control">
                  <MapPin size={16} />
                  <select
                    name="location"
                    aria-label={t("home.selectLocation")}
                    defaultValue={searchParams.get("location") ?? ""}
                  >
                    <option value="">{t("home.selectLocation")}</option>
                    {locationOptions.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <label className="premium-input-wrap search-date-field search-field">
                <span className="search-field-label">{t("home.availableFrom")}</span>
                <span className="search-field-control">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    name="check_in"
                    aria-label={t("home.availableFrom")}
                    title={t("home.availableFrom")}
                    defaultValue={searchParams.get("check_in") ?? ""}
                  />
                </span>
              </label>
              <label className="premium-input-wrap search-date-field search-field">
                <span className="search-field-label">{t("home.availableTo")}</span>
                <span className="search-field-control">
                  <CalendarDays size={16} />
                  <input
                    type="date"
                    name="check_out"
                    aria-label={t("home.availableTo")}
                    title={t("home.availableTo")}
                    defaultValue={searchParams.get("check_out") ?? ""}
                  />
                </span>
              </label>
              <label className="premium-input-wrap search-field">
                <span className="search-field-label">{t("home.minPrice")}</span>
                <span className="search-field-control">
                  <Banknote size={16} />
                  <input
                    type="number"
                    name="min_price"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder={t("home.minPrice")}
                    defaultValue={searchParams.get("min_price") ?? ""}
                  />
                </span>
              </label>
              <label className="premium-input-wrap search-field">
                <span className="search-field-label">{t("home.maxPrice")}</span>
                <span className="search-field-control">
                  <Banknote size={16} />
                  <input
                    type="number"
                    name="max_price"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    placeholder={t("home.maxPrice")}
                    defaultValue={searchParams.get("max_price") ?? ""}
                  />
                </span>
              </label>
            </div>

            <button
              type="button"
              className="more-filter-toggle"
              onClick={() => setShowExtra(!showExtra)}
              aria-expanded={showExtra}
            >
              <SlidersHorizontal size={16} />
              <span>{t("home.moreFilters")}</span>
            </button>

            <div className={`mobile-extra-filters ${showExtra ? "open" : ""}`}>
              <div className="room-bath-filter-grid">
                <div className="premium-input-wrap">
                  <DoorOpen size={16} />
                  <input
                    type="number"
                    min={0}
                    name="min_rooms"
                    placeholder={t("home.minRooms")}
                    defaultValue={searchParams.get("min_rooms") ?? ""}
                  />
                </div>
                <div className="premium-input-wrap">
                  <Bath size={16} />
                  <input
                    type="number"
                    min={0}
                    name="min_bathrooms"
                    placeholder={t("home.minBathrooms")}
                    defaultValue={searchParams.get("min_bathrooms") ?? ""}
                  />
                </div>
              </div>

              <div className="tags-filter extra-filter-tags">
                {tagOptions.map((tag) => (
                  <label key={tag} className="tag-checkbox">
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      defaultChecked={selectedTags.includes(tag)}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="search-actions-inline">
              <button type="submit" className="search-btn" disabled={isPending}>
                <Search size={18} aria-hidden />
                <span className="btn-label">{t("common.search")}</span>
              </button>
              <button
                type="button"
                className="reset-search-btn"
                onClick={handleReset}
              >
                <RotateCcw size={16} aria-hidden />
                <span className="btn-label">{t("common.reset")}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
