"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Bike,
  Home,
  MapPin,
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

export function HomeHub({ homes, restaurants, places, modules }: HomeHubProps) {
  const { t } = useLocale();

  return (
    <>
      <section className="hub-hero">
        <div className="hub-hero-bg" aria-hidden />
        <div className="container hub-hero-inner">
          <p className="hub-brand">EVVA.AZ</p>
          <h1>{t("home.hubTitle")}</h1>
          <p className="hub-hero-text">{t("home.hubSubtitle")}</p>
          <div className="hub-hero-actions">
            <Link href="/homes" className="hub-cta hub-cta--primary">
              <Home size={18} aria-hidden />
              {t("nav.homes")}
            </Link>
            {modules.restaurants ? (
              <Link href="/restaurants" className="hub-cta">
                <UtensilsCrossed size={18} aria-hidden />
                {t("nav.restaurants")}
              </Link>
            ) : null}
            {modules.places ? (
              <Link href="/places" className="hub-cta">
                <MapPin size={18} aria-hidden />
                {t("nav.places")}
              </Link>
            ) : null}
            {modules.delivery ? (
              <Link href="/delivery" className="hub-cta">
                <Bike size={18} aria-hidden />
                {t("nav.delivery")}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <section className="hub-section">
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

      {modules.places ? (
        <section className="hub-section hub-section--alt">
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
        <section className="hub-section">
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
