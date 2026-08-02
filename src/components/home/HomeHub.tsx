"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  Bike,
  Home,
  MapPin,
  Search,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { restaurantPath, placePath } from "@/lib/slug";
import { useLocale } from "@/providers/LocaleProvider";

export type HubHomeCard = {
  id: number;
  title: string;
  location: string;
  price: number;
  rating: number;
  ratingCount: number;
  image: string;
};

export type HubWeekPick = {
  id: number;
  title: string;
  location: string;
  price: number;
  image: string;
  story: string;
};

export type HubReviewCard = {
  comment: string;
  full_name: string;
  propertyTitle: string;
  propertyId: number;
  rating: number;
};

export type HubRestaurantCard = {
  id: number;
  name: string;
  slug: string;
  location: string;
  avg_rating: number;
  rating_count: number;
  cover_url: string;
};

export type HubPlaceCard = {
  id: number;
  title: string;
  slug: string;
  location: string;
  avg_rating: number;
  rating_count: number;
  cover_url: string;
};

interface HomeHubProps {
  homes: HubHomeCard[];
  weekPick?: HubWeekPick | null;
  reviews?: HubReviewCard[];
  restaurants: HubRestaurantCard[];
  places: HubPlaceCard[];
  modules: {
    restaurants: boolean;
    places: boolean;
    delivery: boolean;
  };
}

function RatingBadge({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="hub-rating">
      <Star size={13} aria-hidden />
      {rating > 0 ? rating.toFixed(1) : "—"}
      {count > 0 ? <em>({count})</em> : null}
    </span>
  );
}

export function HomeHub({ homes, weekPick, reviews = [], restaurants, places, modules }: HomeHubProps) {
  const { t } = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleQuickSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const qs = params.toString();
    router.push(qs ? `/homes?${qs}#properties` : "/homes#properties");
  }

  return (
    <>
      <section className="hub-hero">
        <div className="hub-hero-bg" aria-hidden />
        <div className="container hub-hero-inner">
          <p className="hub-brand">EVVA.AZ</p>
          <h1>{t("home.hubTitle")}</h1>
          <p className="hub-hero-text">{t("home.hubSubtitle")}</p>

          <form className="hub-quick-search" onSubmit={handleQuickSearch}>
            <label className="hub-quick-search-field">
              <Search size={22} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("home.hubSearchPlaceholder")}
                aria-label={t("home.hubSearchPlaceholder")}
              />
            </label>
            <button type="submit" className="hub-cta hub-cta--primary">
              {t("home.hubSearchButton")}
            </button>
          </form>

          <div className="hub-explore">
            <a href="#hub-homes" className="hub-explore-main">
              <span className="hub-explore-icon" aria-hidden>
                <ArrowDown size={22} />
              </span>
              <span className="hub-explore-copy">
                <strong>{t("home.hubScrollHint")}</strong>
                <small>{t("home.hubScrollSub")}</small>
              </span>
              <ArrowRight className="hub-explore-arrow" size={22} aria-hidden />
            </a>
            <div className="hub-explore-jumps">
              <a href="#hub-homes" className="hub-explore-jump">
                <Home size={16} aria-hidden />
                {t("home.topHomesKicker")}
              </a>
              {modules.places ? (
                <a href="#hub-places" className="hub-explore-jump">
                  <MapPin size={16} aria-hidden />
                  {t("nav.places")}
                </a>
              ) : null}
              {modules.restaurants ? (
                <a href="#hub-restaurants" className="hub-explore-jump">
                  <UtensilsCrossed size={16} aria-hidden />
                  {t("nav.restaurants")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {weekPick ? (
        <section className="hub-section hub-week-pick">
          <div className="container">
            <div className="week-pick">
              <div className="week-pick-media">
                <Image
                  src={weekPick.image}
                  alt={weekPick.title}
                  width={720}
                  height={480}
                  unoptimized
                />
              </div>
              <div className="week-pick-body">
                <span className="section-kicker">{t("home.weekPickKicker")}</span>
                <h2>{weekPick.title}</h2>
                <p className="week-pick-loc">
                  <MapPin size={16} aria-hidden /> {weekPick.location}
                </p>
                <p className="week-pick-story">{weekPick.story}</p>
                <div className="week-pick-foot">
                  <strong>
                    {weekPick.price} {t("common.perNight")}
                  </strong>
                  <Link href={`/property/${weekPick.id}`} className="hub-cta hub-cta--primary">
                    {t("home.weekPickCta")} <ArrowRight size={16} aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="hub-section hub-presets">
        <div className="container">
          <span className="section-kicker">{t("home.presetsKicker")}</span>
          <h2 className="hub-presets-title">{t("home.presetsTitle")}</h2>
          <div className="presets-row">
            <Link href="/homes?tags=Hovuz" className="preset-chip">
              {t("home.presetPool")}
            </Link>
            <Link href="/homes?tags=VİLLA&min_rooms=2" className="preset-chip">
              {t("home.presetFamily")}
            </Link>
            <Link href="/homes?search=A-frame" className="preset-chip">
              {t("home.presetRomantic")}
            </Link>
            <Link href="/homes?min_rooms=3" className="preset-chip">
              {t("home.presetFriends")}
            </Link>
          </div>
        </div>
      </section>

      <section className="hub-section" id="hub-homes">
        <div className="container">
          <div className="hub-section-head">
            <div>
              <span className="section-kicker">{t("home.topHomesKicker")}</span>
              <h2>{t("home.topHomesTitle")}</h2>
              <p>{t("home.topHomesText")}</p>
            </div>
            <Link href="/homes?sort=rating_desc" className="hub-see-all">
              {t("home.seeAllHomes")} <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="hub-grid">
            {homes.length === 0 ? (
              <p className="hub-empty">{t("home.topEmpty")}</p>
            ) : (
              homes.map((home) => (
                <Link key={home.id} href={`/property/${home.id}`} className="hub-card">
                  <div className="hub-card-media">
                    <Image
                      src={home.image}
                      alt={home.title}
                      width={420}
                      height={280}
                      unoptimized
                    />
                  </div>
                  <div className="hub-card-body">
                    <RatingBadge rating={home.rating} count={home.ratingCount} />
                    <h3>{home.title}</h3>
                    <p>
                      <MapPin size={14} aria-hidden /> {home.location}
                    </p>
                    <strong>
                      {home.price} {t("common.perNight")}
                    </strong>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {reviews.length > 0 ? (
        <section className="hub-section hub-reviews">
          <div className="container">
            <div className="hub-section-head">
              <div>
                <span className="section-kicker">{t("home.reviewsKicker")}</span>
                <h2>{t("home.reviewsTitle")}</h2>
              </div>
            </div>
            <div className="reviews-showcase">
              {reviews.map((review, index) => (
                <article key={`${review.propertyId}-${index}`} className="review-quote-card">
                  <blockquote>&ldquo;{review.comment}&rdquo;</blockquote>
                  <footer>
                    <strong>{review.full_name || t("home.reviewGuest")}</strong>
                    <span>
                      {review.propertyTitle} · {review.rating}/10
                    </span>
                    <Link href={`/property/${review.propertyId}`}>{t("common.viewDetails")}</Link>
                  </footer>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {modules.places ? (
        <section className="hub-section hub-section--alt" id="hub-places">
          <div className="container">
            <div className="hub-section-head">
              <div>
                <span className="section-kicker">{t("home.topPlacesKicker")}</span>
                <h2>{t("home.topPlacesTitle")}</h2>
                <p>{t("home.topPlacesText")}</p>
              </div>
              <Link href="/places?sort=rating" className="hub-see-all">
                {t("home.seeAllPlaces")} <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="hub-grid">
              {places.length === 0 ? (
                <p className="hub-empty">{t("home.topEmpty")}</p>
              ) : (
                places.map((place) => (
                  <Link key={place.id} href={placePath(place)} className="hub-card">
                    <div className="hub-card-media">
                      {place.cover_url && !place.cover_url.endsWith("no-image.svg") ? (
                        <Image
                          src={place.cover_url}
                          alt={place.title}
                          width={420}
                          height={280}
                          unoptimized
                        />
                      ) : (
                        <span className="hub-card-fallback">
                          <MapPin size={36} aria-hidden />
                        </span>
                      )}
                    </div>
                    <div className="hub-card-body">
                      <RatingBadge rating={place.avg_rating} count={place.rating_count} />
                      <h3>{place.title}</h3>
                      <p>
                        <MapPin size={14} aria-hidden /> {place.location}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {modules.restaurants ? (
        <section className="hub-section" id="hub-restaurants">
          <div className="container">
            <div className="hub-section-head">
              <div>
                <span className="section-kicker">{t("home.topRestaurantsKicker")}</span>
                <h2>{t("home.topRestaurantsTitle")}</h2>
                <p>{t("home.topRestaurantsText")}</p>
              </div>
              <Link href="/restaurants?sort=rating" className="hub-see-all">
                {t("home.seeAllRestaurants")} <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
            <div className="hub-grid">
              {restaurants.length === 0 ? (
                <p className="hub-empty">{t("home.topEmpty")}</p>
              ) : (
                restaurants.map((restaurant) => (
                  <Link
                    key={restaurant.id}
                    href={restaurantPath(restaurant)}
                    className="hub-card"
                  >
                    <div className="hub-card-media">
                      {restaurant.cover_url &&
                      !restaurant.cover_url.endsWith("no-image.svg") ? (
                        <Image
                          src={restaurant.cover_url}
                          alt={restaurant.name}
                          width={420}
                          height={280}
                          unoptimized
                        />
                      ) : (
                        <span className="hub-card-fallback">
                          <UtensilsCrossed size={36} aria-hidden />
                        </span>
                      )}
                    </div>
                    <div className="hub-card-body">
                      <RatingBadge
                        rating={restaurant.avg_rating}
                        count={restaurant.rating_count}
                      />
                      <h3>{restaurant.name}</h3>
                      <p>
                        <MapPin size={14} aria-hidden /> {restaurant.location}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      ) : null}

      {modules.delivery ? (
        <section className="hub-delivery">
          <div className="container hub-delivery-inner">
            <div>
              <span className="section-kicker">{t("nav.delivery")}</span>
              <h2>{t("home.deliveryTitle")}</h2>
              <p>{t("home.deliveryText")}</p>
            </div>
            <Link href="/delivery" className="hub-cta hub-cta--primary">
              <Bike size={18} aria-hidden />
              {t("home.deliveryCta")}
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
