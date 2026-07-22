"use client";

import Link from "next/link";
import {
  BadgePercent,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";
import Image from "next/image";
import { PlaceGallery } from "@/components/places/PlaceGallery";
import { PlaceRatingForm } from "@/components/places/PlaceRatingForm";
import type { Place } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

interface PlaceDetailClientProps {
  place: Place;
  images: string[];
  mapsUrl: string;
}

export function PlaceDetailClient({ place, images, mapsUrl }: PlaceDetailClientProps) {
  const { t } = useLocale();

  return (
    <section className="place-detail">
      <div className="container">
        <div className="place-detail-topbar">
          <nav className="crumbs" style={{ margin: 0 }}>
            <Link href="/">{t("common.home")}</Link>
            <ChevronRight size={14} />
            <Link href="/places">{t("nav.places")}</Link>
            <ChevronRight size={14} />
            <span>{place.title}</span>
          </nav>
        </div>

        <section className="place-hero">
          <div className="place-hero-meta">
            <span className="place-hero-kicker">
              <Star size={14} /> {place.rating?.toFixed(1) ?? "0.0"} / 10 •{" "}
              {t("common.votes", { count: place.voteCount ?? 0 })}
            </span>
            {place.premium ? (
              <span className="premium-label">{t("common.premium")}</span>
            ) : null}
          </div>
          <h1>{place.title}</h1>
          <p className="place-hero-loc">
            <MapPin size={16} /> {place.location}
          </p>
        </section>

        {images.length > 0 && (
          <PlaceGallery images={images} title={place.title} />
        )}

        {(place.activities?.length ?? 0) > 0 && (
          <section className="place-activities-section">
            <div className="place-activities-heading">
              <div>
                <span><Sparkles size={15} /> Kəşf et və əylən</span>
                <h2>Aktivliklər və qiymətlər</h2>
                <p>Bu məkanda edə biləcəyiniz ən maraqlı fəaliyyətləri seçin.</p>
              </div>
              <div className="evva-ticket-discount">
                <BadgePercent size={28} />
                <div>
                  <strong>EVVA.AZ endirimi</strong>
                  <span>Bu məkanlara bileti EVVA.AZ üzərindən aldıqda xüsusi endirim əldə edəcəksiniz.</span>
                </div>
              </div>
            </div>

            <div className="place-activities-grid">
              {place.activities?.map((activity, index) => {
                const activityImage =
                  activity.image ||
                  images[(index + 1) % Math.max(images.length, 1)] ||
                  place.image;
                return (
                  <article className="place-activity-card" key={`${activity.name}-${index}`}>
                    <div className="place-activity-image">
                      {activityImage ? (
                        <Image
                          src={activityImage}
                          alt={activity.name}
                          width={520}
                          height={320}
                          unoptimized
                        />
                      ) : (
                        <Sparkles size={44} />
                      )}
                      <span className="place-activity-price">
                        {activity.price > 0 ? `${activity.price} ₼` : "Pulsuz"}
                      </span>
                    </div>
                    <div className="place-activity-body">
                      <small>Aktivlik</small>
                      <h3>{activity.name}</h3>
                      <span><BadgePercent size={14} /> EVVA.AZ ilə endirim fürsəti</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="place-info-grid">
          <div className="place-info-box">
            <h2>{t("common.info")}</h2>
            <p>{place.longDescription ?? place.description}</p>
            <span className="tag" style={{ marginTop: 12 }}>
              {place.category}
            </span>
          </div>

          <aside className="place-info-box">
            <h3>{t("common.details")}</h3>
            <dl className="place-details-list">
              <div>
                <dt>{t("common.location")}</dt>
                <dd>{place.location}</dd>
              </div>
              <div>
                <dt>{t("common.address")}</dt>
                <dd>{place.address ?? "—"}</dd>
              </div>
              {place.hours && (
                <div>
                  <dt>
                    <Clock size={14} style={{ display: "inline", marginRight: 4 }} />
                    {t("common.hours")}
                  </dt>
                  <dd>{place.hours}</dd>
                </div>
              )}
              {place.entryFee && (
                <div>
                  <dt>
                    <Ticket size={14} style={{ display: "inline", marginRight: 4 }} />
                    {t("common.entry")}
                  </dt>
                  <dd>{place.entryFee}</dd>
                </div>
              )}
            </dl>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="premium-map-btn"
              style={{ marginTop: 16, marginBottom: 20 }}
            >
              <MapPin size={16} /> {t("common.viewOnMap")}
            </a>

            <h3>{t("common.rating")}</h3>
            <PlaceRatingForm />
          </aside>
        </section>
      </div>
    </section>
  );
}
