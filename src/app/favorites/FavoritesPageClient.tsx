"use client";

import Link from "next/link";
import { FavoritesList } from "@/components/favorites/FavoritesList";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

export function FavoritesPageClient() {
  const { t } = useLocale();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "60px 20px" }}>
        {t("common.loading")}
      </p>
    );
  }

  if (!user) {
    return (
      <section className="properties" style={{ paddingTop: 32 }}>
        <div className="container" style={{ textAlign: "center", padding: "60px 20px" }}>
          <p>{t("favorites.loginRequired")}</p>
          <Link
            href="/login?next=/favorites"
            className="auth-btn primary"
            style={{ marginTop: 16, display: "inline-flex" }}
          >
            {t("common.login")}
          </Link>
        </div>
      </section>
    );
  }

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
