"use client";

import { FavoritesList } from "@/components/favorites/FavoritesList";
import { useLocale } from "@/providers/LocaleProvider";

export function FavoritesPageClient() {
  const { t } = useLocale();

  return (
    <section className="properties" style={{ paddingTop: 32 }}>
      <div className="container">
        <div className="section-intro-wrap" style={{ marginBottom: 24 }}>
          <div>
            <span className="section-kicker">{t("favorites.kicker")}</span>
            <h1 style={{ margin: "8px 0 0" }}>{t("favorites.subtitle")}</h1>
          </div>
        </div>
        <FavoritesList />
      </div>
    </section>
  );
}
