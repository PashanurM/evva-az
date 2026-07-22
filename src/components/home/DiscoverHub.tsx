"use client";

import Link from "next/link";
import { ArrowRight, Compass } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export function DiscoverHub() {
  const { t } = useLocale();

  return (
    <section className="discover-hub" id="discover-hub">
      <div className="container">
        <div className="section-intro-wrap" style={{ marginBottom: 16 }}>
          <div>
            <span className="section-kicker">{t("home.discoverKicker")}</span>
            <div className="results-badge">
              <Compass size={16} />
              <span>{t("home.discoverBadge")}</span>
            </div>
          </div>
        </div>
        <div className="discover-grid">
          <article className="discover-card">
            <h3>{t("home.restaurantsCardTitle")}</h3>
            <p>{t("home.restaurantsCardText")}</p>
            <Link href="/restaurants">
              <ArrowRight size={16} /> {t("home.restaurantsCardLink")}
            </Link>
          </article>
          <article className="discover-card">
            <h3>{t("home.placesCardTitle")}</h3>
            <p>{t("home.placesCardText")}</p>
            <Link href="/places">
              <ArrowRight size={16} /> {t("home.placesCardLink")}
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
