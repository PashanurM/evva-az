"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Clock,
  Coffee,
  IceCream2,
  MapPin,
  Package,
  Phone,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { PlaceGallery } from "@/components/places/PlaceGallery";
import { assetUrl } from "@/lib/assets";
import type { RestaurantMenuCategoryPublic } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

export interface RestaurantDetailData {
  id: number;
  name: string;
  location: string;
  address?: string;
  opening_hours?: string;
  phone?: string;
  whatsapp?: string;
  average_price?: number;
  avg_rating: number;
  rating_count: number;
  is_featured: boolean;
  description?: string;
  short_description?: string;
  cuisine_tags?: string;
  discount_text?: string;
  local_foods?: string;
  foreign_foods?: string;
  desserts?: string;
  drinks?: string;
  cover: string;
  images?: string[];
  mapsUrl?: string;
  menu?: RestaurantMenuCategoryPublic[];
  meal_sets?: RestaurantMenuCategoryPublic[];
}

interface RestaurantDetailClientProps {
  restaurant: RestaurantDetailData;
}

type LegacyDish = { title: string; price: number | null };

function splitMenuItems(text?: string): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLegacyDish(raw: string): LegacyDish {
  const match = raw.match(
    /^(.*?)(?:\s*[-–—:|]\s*|\s+)(\d+(?:[.,]\d+)?)\s*(?:₼|azn|manat)?\s*$/i,
  );
  if (match) {
    const title = match[1].replace(/[:\-–—|]\s*$/, "").trim();
    const price = Number(match[2].replace(",", "."));
    if (title && Number.isFinite(price)) {
      return { title, price };
    }
  }
  return { title: raw, price: null };
}

function formatPrice(
  price: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (!Number.isFinite(price) || price <= 0) return t("restaurants.menuEmptyPrice");
  return t("restaurants.menuPrice", { price: price.toFixed(2) });
}

const LEGACY_META: Record<
  string,
  { icon: typeof UtensilsCrossed; accent: string }
> = {
  local_foods: { icon: UtensilsCrossed, accent: "local" },
  foreign_foods: { icon: UtensilsCrossed, accent: "foreign" },
  desserts: { icon: IceCream2, accent: "dessert" },
  drinks: { icon: Coffee, accent: "drink" },
};

function MenuCategoryBlock({
  category,
  setStyle = false,
  formatItemPrice,
}: {
  category: RestaurantMenuCategoryPublic;
  setStyle?: boolean;
  formatItemPrice: (price: number) => string;
}) {
  if (!category.items?.length) return null;
  return (
    <section
      id={`menu-cat-${category.id}`}
      className={`rmenu-category${setStyle ? " is-set" : ""}`}
    >
      <div className="rmenu-category-head">
        <span className="rmenu-category-icon">
          {setStyle ? <Package size={18} aria-hidden /> : <UtensilsCrossed size={18} aria-hidden />}
        </span>
        <h3>{category.title}</h3>
        <em>{category.items.length}</em>
      </div>
      <div className="rmenu-board">
        {category.items.map((item) => {
          const image = item.image_url ? assetUrl(item.image_url) : "";
          const ingredients = (item.ingredients || item.description || "").trim();
          const price = Number(item.price || 0);
          return (
            <article key={item.id} className={`rmenu-dish${image ? " has-media" : ""}`}>
              {image ? (
                <div className="rmenu-dish-media">
                  <Image
                    src={image}
                    alt={item.title}
                    width={120}
                    height={120}
                    unoptimized
                  />
                </div>
              ) : (
                <span className="rmenu-dish-mark" aria-hidden>
                  {setStyle ? <Package size={18} /> : <UtensilsCrossed size={18} />}
                </span>
              )}
              <div className="rmenu-dish-body">
                <div className="rmenu-dish-topline">
                  <strong>{item.title}</strong>
                  <span className="rmenu-dish-dots" aria-hidden />
                  <em>{formatItemPrice(price)}</em>
                </div>
                {ingredients ? <p>{ingredients}</p> : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function RestaurantDetailClient({ restaurant }: RestaurantDetailClientProps) {
  const { t } = useLocale();
  const gallery =
    restaurant.images?.length
      ? restaurant.images
      : restaurant.cover && !restaurant.cover.endsWith("no-image.svg")
        ? [restaurant.cover]
        : [];

  const structuredMenu = (restaurant.menu || []).filter((c) => (c.items || []).length > 0);
  const mealSets = (restaurant.meal_sets || []).filter((c) => (c.items || []).length > 0);
  const navCategories = useMemo(
    () => [...structuredMenu, ...mealSets],
    [structuredMenu, mealSets],
  );
  const [activeCat, setActiveCat] = useState<number | null>(navCategories[0]?.id ?? null);

  const legacySections = useMemo(
    () =>
      [
        {
          key: "local_foods",
          title: t("restaurants.legacyLocal"),
          items: splitMenuItems(restaurant.local_foods).map(parseLegacyDish),
        },
        {
          key: "foreign_foods",
          title: t("restaurants.legacyForeign"),
          items: splitMenuItems(restaurant.foreign_foods).map(parseLegacyDish),
        },
        {
          key: "desserts",
          title: t("restaurants.legacyDesserts"),
          items: splitMenuItems(restaurant.desserts).map(parseLegacyDish),
        },
        {
          key: "drinks",
          title: t("restaurants.legacyDrinks"),
          items: splitMenuItems(restaurant.drinks).map(parseLegacyDish),
        },
      ].filter((section) => section.items.length > 0),
    [restaurant, t],
  );

  const showLegacy = structuredMenu.length === 0 && mealSets.length === 0 && legacySections.length > 0;
  const priceLabel = (price: number) => formatPrice(price, t);
  const avgHint =
    restaurant.average_price && restaurant.average_price > 0
      ? t("restaurants.menuAvgHint", { price: restaurant.average_price })
      : "";

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
          {restaurant.discount_text ? (
            <p className="restaurant-discount-text">{restaurant.discount_text}</p>
          ) : null}
        </section>

        {gallery.length > 0 ? (
          <PlaceGallery images={gallery} title={restaurant.name} />
        ) : null}

        {navCategories.length > 0 ? (
          <section className="rmenu">
            <div className="rmenu-head">
              <div>
                <span className="section-kicker">{t("restaurants.menuTitle")}</span>
                <h2>{t("restaurants.menuTitle")}</h2>
                {avgHint ? <p className="rmenu-avg-hint">{avgHint}</p> : null}
              </div>
            </div>

            {navCategories.length > 1 ? (
              <div className="rmenu-nav" role="tablist">
                {navCategories.map((category) => (
                  <a
                    key={category.id}
                    href={`#menu-cat-${category.id}`}
                    className={`rmenu-nav-chip${activeCat === category.id ? " is-active" : ""}`}
                    onClick={() => setActiveCat(category.id)}
                  >
                    {category.title}
                  </a>
                ))}
              </div>
            ) : null}

            {structuredMenu.length > 0 ? (
              <div className="rmenu-block">
                {structuredMenu.map((category) => (
                  <MenuCategoryBlock
                    key={category.id}
                    category={category}
                    formatItemPrice={priceLabel}
                  />
                ))}
              </div>
            ) : null}

            {mealSets.length > 0 ? (
              <div className="rmenu-block rmenu-block--sets">
                <div className="rmenu-sets-label">
                  <Package size={18} aria-hidden />
                  <h2>{t("restaurants.mealSetsTitle")}</h2>
                </div>
                {mealSets.map((category) => (
                  <MenuCategoryBlock
                    key={category.id}
                    category={category}
                    setStyle
                    formatItemPrice={priceLabel}
                  />
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        {showLegacy ? (
          <section className="rmenu rmenu--legacy">
            <div className="rmenu-head">
              <div>
                <span className="section-kicker">{t("restaurants.menuTitle")}</span>
                <h2>{t("restaurants.menuTitle")}</h2>
                {avgHint ? <p className="rmenu-avg-hint">{avgHint}</p> : null}
              </div>
            </div>

            <div className="rmenu-legacy-nav">
              {legacySections.map((section) => (
                <a
                  key={section.key}
                  href={`#legacy-${section.key}`}
                  className="rmenu-nav-chip"
                >
                  {section.title}
                </a>
              ))}
            </div>

            <div className="rmenu-legacy-grid">
              {legacySections.map((section) => {
                const meta = LEGACY_META[section.key] || LEGACY_META.local_foods;
                const Icon = meta.icon;
                return (
                  <section
                    key={section.key}
                    id={`legacy-${section.key}`}
                    className={`rmenu-legacy-card rmenu-legacy-card--${meta.accent}`}
                  >
                    <header className="rmenu-legacy-card-head">
                      <span className="rmenu-category-icon">
                        <Icon size={18} aria-hidden />
                      </span>
                      <h3>{section.title}</h3>
                      <em>{section.items.length}</em>
                    </header>
                    <div className="rmenu-board">
                      {section.items.map((dish, index) => (
                        <article
                          key={`${section.key}-${dish.title}-${index}`}
                          className="rmenu-dish"
                        >
                          <span className="rmenu-dish-mark" aria-hidden>
                            <Icon size={16} />
                          </span>
                          <div className="rmenu-dish-body">
                            <div className="rmenu-dish-topline">
                              <strong>{dish.title}</strong>
                              <span className="rmenu-dish-dots" aria-hidden />
                              <em>
                                {dish.price != null
                                  ? priceLabel(dish.price)
                                  : t("restaurants.menuEmptyPrice")}
                              </em>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </section>
        ) : null}

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
              {restaurant.whatsapp && (
                <div>
                  <dt>WhatsApp</dt>
                  <dd>
                    <a
                      href={`https://wa.me/${restaurant.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {restaurant.whatsapp}
                    </a>
                  </dd>
                </div>
              )}
              {restaurant.average_price ? (
                <div>
                  <dt>{t("common.avgPrice")}</dt>
                  <dd>{restaurant.average_price} ₼</dd>
                </div>
              ) : null}
            </dl>

            {restaurant.mapsUrl ? (
              <a
                href={restaurant.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="premium-map-btn"
                style={{ marginTop: 16 }}
              >
                <MapPin size={16} /> {t("common.viewOnMap")}
              </a>
            ) : null}
          </aside>
        </section>
      </div>
    </section>
  );
}
