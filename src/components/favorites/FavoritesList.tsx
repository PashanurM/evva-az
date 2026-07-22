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

    void api.getFavorites().then((res) => {
      if (!active) return;
      if (!res.success) {
        setError(res.error || t("favorites.loadFailed"));
        setItems([]);
      } else {
        setItems((res.data?.items || []).map(mapApiProperty));
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

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
        <Link href="/login" className="auth-btn primary" style={{ marginTop: 16, display: "inline-flex" }}>
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
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
