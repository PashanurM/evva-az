"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { mapApiProperty } from "@/lib/mappers";
import { PropertyCard } from "@/components/home/PropertyCard";
import { useLocale } from "@/providers/LocaleProvider";
import type { Property } from "@/types";

export function FavoritesList() {
  const { t } = useLocale();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.getFavorites();
        if (!active) return;
        if (!res.success) {
          setError(res.error || t("favorites.loadFailed"));
          setItems([]);
          return;
        }
        const mapped: Property[] = [];
        for (const item of res.data?.items || []) {
          try {
            mapped.push({
              ...mapApiProperty(item),
              isFavorite: true,
            });
          } catch {
            // Skip broken favorite rows so one bad item does not hang the page.
          }
        }
        setItems(mapped);
      } catch {
        if (!active) return;
        setError(t("favorites.loadFailed"));
        setItems([]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [t]);

  if (loading) {
    return (
      <p style={{ textAlign: "center", padding: "60px 20px" }}>
        {t("common.loading")}
      </p>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p>{error}</p>
        <Link href="/login?next=/favorites" className="auth-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
          {t("common.login")}
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <p>{t("favorites.empty")}</p>
        <Link href="/" className="auth-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
          {t("common.browseListings")}
        </Link>
      </div>
    );
  }

  return (
    <div className="properties-grid">
      {items.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onFavoriteChange={(favorite) => {
            if (!favorite) {
              setItems((prev) => prev.filter((item) => item.id !== property.id));
            }
          }}
        />
      ))}
    </div>
  );
}
