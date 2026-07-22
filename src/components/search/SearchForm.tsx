"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { SiteConfig } from "@/lib/types";

interface SearchFormProps {
  config: SiteConfig;
  total: number;
  initialFilters: Record<string, string | string[] | undefined>;
}

export function SearchForm({ config, total, initialFilters }: SearchFormProps) {
  const router = useRouter();

  const [location, setLocation] = useState(String(initialFilters.location || ""));
  const [minPrice, setMinPrice] = useState(String(initialFilters.min_price || ""));
  const [maxPrice, setMaxPrice] = useState(String(initialFilters.max_price || ""));
  const [minRooms, setMinRooms] = useState(String(initialFilters.min_rooms || ""));
  const [minBathrooms, setMinBathrooms] = useState(String(initialFilters.min_bathrooms || ""));
  const [sort, setSort] = useState(String(initialFilters.sort || "newest"));
  const [tags, setTags] = useState<string[]>(() => {
    const raw = initialFilters.tags;
    if (Array.isArray(raw)) return raw.map(String);
    if (typeof raw === "string" && raw) return raw.split(",");
    return [];
  });
  const [extraOpen, setExtraOpen] = useState(false);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (minRooms) params.set("min_rooms", minRooms);
    if (minBathrooms) params.set("min_bathrooms", minBathrooms);
    if (sort && sort !== "newest") params.set("sort", sort);
    tags.forEach((tag) => params.append("tags", tag));
    params.set("scroll", "properties");
    router.push(`/?${params.toString()}`);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  return (
    <>
      <section className="hero" data-testid="hero-section">
        <div className="hero-blur hero-blur-left" />
        <div className="hero-blur hero-blur-right" />
        <div className="container hero-layout">
          <div className="search-box search-box-premium">
            <div className="search-box-head">
              <div>
                <h3>Qəbələdə uyğun evi rahat tap</h3>
                <p>Ünvan, qiymət və xüsusiyyətlərə görə sürətli axtarış et.</p>
              </div>
              <div className="hero-mini-info">
                <span className="hero-mini-pill">
                  <i className="fas fa-house" /> {total} aktiv elan
                </span>
                <span className="hero-mini-pill">
                  <i className="fas fa-star" /> Seçilmiş villalar
                </span>
              </div>
            </div>

            <form id="searchForm" className="evva-search-form-premium" onSubmit={submit}>
              <div className="evva-filter-core evva-filter-core-simple">
                <div className="premium-select-wrap filter-location-main">
                  <i className="fas fa-location-dot" />
                  <select
                    name="location"
                    aria-label="Məkan seç"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  >
                    <option value="">Məkan seç</option>
                    {config.locations.map((loc) => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                <div className="mobile-price-range" aria-label="Qiymət aralığı">
                  <div className="premium-input-wrap">
                    <i className="fas fa-manat-sign" />
                    <input
                      type="number"
                      name="min_price"
                      placeholder="Min. qiymət"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div className="premium-input-wrap">
                    <i className="fas fa-manat-sign" />
                    <input
                      type="number"
                      name="max_price"
                      placeholder="Maks. qiymət"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="tags-filter main-filter-tags extra-filter-tags compact-filter-tags" aria-label="Filter tagları">
                {Object.entries(config.tag_options).map(([value, label]) => (
                  <label key={value} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={tags.includes(value)}
                      onChange={() => toggleTag(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>

            <button
              type="button"
              className="more-filter-toggle"
              aria-expanded={extraOpen}
              onClick={() => setExtraOpen(!extraOpen)}
            >
              <i className="fas fa-sliders" /> <span>Daha çox filter seç</span>
            </button>

            <div
              className={`mobile-extra-filters${extraOpen ? " is-open" : ""}`}
              id="mobileExtraFilters"
            >
              <div className="room-bath-filter-grid room-bath-filter-grid-minonly">
                <div className="premium-input-wrap">
                  <i className="fas fa-door-open" />
                  <input
                    type="number"
                    min={0}
                    name="min_rooms"
                    placeholder="Minimum otaq sayı"
                    value={minRooms}
                    onChange={(e) => setMinRooms(e.target.value)}
                  />
                </div>
                <div className="premium-input-wrap">
                  <i className="fas fa-bath" />
                  <input
                    type="number"
                    min={0}
                    name="min_bathrooms"
                    placeholder="Minimum hamam sayı"
                    value={minBathrooms}
                    onChange={(e) => setMinBathrooms(e.target.value)}
                  />
                </div>
              </div>
            </div>

              <div className="search-actions-inline evva-search-actions">
                <button type="submit" className="search-btn">
                  <i className="fas fa-magnifying-glass" /> Axtar
                </button>
                <button type="button" className="reset-search-btn" onClick={() => router.push("/")}>
                  <i className="fas fa-rotate-left" /> Sıfırla
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="section-intro">
        <div className="container section-intro-wrap">
          <div>
            <span className="section-kicker">Seçilmiş elanlar</span>
            <div className="results-badge">
              <i className="fas fa-house" />
              <span>{total} nəticə</span>
            </div>
          </div>

          <form className="sort-form-modern" onSubmit={(e) => { e.preventDefault(); submit(); }}>
            <label htmlFor="sort">Sırala:</label>
            <select
              id="sort"
              name="sort"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setTimeout(submit, 0);
              }}
            >
              <option value="newest">Ən yeni</option>
              <option value="price_desc">Bahadan ucuza</option>
              <option value="price_asc">Ucuzdan bahaya</option>
              <option value="views_desc">Ən çox baxılan</option>
              <option value="rating_desc">Ən yüksək reytinq</option>
            </select>
          </form>
        </div>
      </section>
    </>
  );
}
