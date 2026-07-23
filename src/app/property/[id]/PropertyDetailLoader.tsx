"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { mapApiProperty } from "@/lib/mappers";
import { assetUrl } from "@/lib/assets";
import type { Property as ApiProperty } from "@/lib/types";
import type { Property } from "@/types";
import { PropertyDetailClient } from "./PropertyDetailClient";

function buildGallery(mapped: Property): string[] {
  const nextGallery: string[] = [];
  const pushUnique = (url?: string) => {
    if (!url || nextGallery.includes(url)) return;
    nextGallery.push(url);
  };
  pushUnique(mapped.image);
  for (const image of mapped.images || []) pushUnique(image);
  return nextGallery;
}

async function fetchExtraGallery(propertyId: number): Promise<string[]> {
  // Prefer dedicated images route (uses local→Alwaysdata bridge in dev).
  const endpoints = [
    `/api/v1/properties/${propertyId}/images`,
    `/api/v1/properties/${propertyId}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          cover_path?: string;
          cover_url?: string;
          images?: Array<{ path?: string; url?: string; image_path?: string }>;
        };
      };
      if (!json.success || !json.data) continue;

      const urls: string[] = [];
      const push = (value?: string) => {
        const url = assetUrl(value || "");
        if (url && url !== "/assets/no-image.svg" && !urls.includes(url)) urls.push(url);
      };

      push(json.data.cover_url || json.data.cover_path);
      for (const img of json.data.images || []) {
        push(img.url || img.path || img.image_path);
      }
      if (urls.length > 0) return urls;
    } catch {
      // try next
    }
  }

  return [];
}

export function PropertyDetailLoader({
  propertyId,
  initialProperty,
  initialMapsUrl,
  initialGallery,
}: {
  propertyId: number;
  initialProperty?: Property | null;
  initialMapsUrl?: string;
  initialGallery?: string[];
}) {
  const [property, setProperty] = useState<Property | null>(initialProperty ?? null);
  const [mapsUrl, setMapsUrl] = useState(initialMapsUrl || "");
  const [gallery, setGallery] = useState<string[]>(initialGallery || []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!initialProperty);

  useEffect(() => {
    let active = true;

    void (async () => {
      if (!initialProperty) {
        setLoading(true);
        setError("");

        let apiProperty: ApiProperty | null = null;
        const direct = await api.getProperty(propertyId);
        if (direct.success && direct.data?.id) {
          apiProperty = direct.data;
        } else {
          const list = await api.getProperties({ sort: "newest" });
          apiProperty = list.data?.items?.find((item) => item.id === propertyId) ?? null;
        }

        if (!active) return;

        if (!apiProperty) {
          setError("Ev tapılmadı");
          setLoading(false);
          return;
        }

        const mapped = mapApiProperty(apiProperty);
        const nextMaps =
          mapped.lat && mapped.lng
            ? `https://www.google.com/maps/search/?api=1&query=${mapped.lat},${mapped.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapped.location)}`;

        setProperty(mapped);
        setMapsUrl(nextMaps);
        setGallery(buildGallery(mapped));
        setLoading(false);
      }

      // Always try to enrich gallery (detail fallback may only have cover).
      const extra = await fetchExtraGallery(propertyId);
      if (!active || extra.length === 0) return;

      setGallery((prev) => {
        const merged = [...prev];
        for (const url of extra) {
          if (url && !merged.includes(url)) merged.push(url);
        }
        return merged.length > prev.length ? merged : prev;
      });
      setProperty((prev) =>
        prev
          ? {
              ...prev,
              images: Array.from(new Set([...(prev.images || []), ...extra])),
            }
          : prev,
      );
    })();

    return () => {
      active = false;
    };
  }, [propertyId, initialProperty]);

  if (loading) {
    return (
      <section className="page-hero">
        <div className="container">
          <p>Yüklənir...</p>
        </div>
      </section>
    );
  }

  if (!property) {
    return (
      <section className="page-hero">
        <div className="container" style={{ textAlign: "center", padding: "80px 20px" }}>
          <h1>Ev tapılmadı</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {error || "Bu elan mövcud deyil və ya müvəqqəti əlçatan deyil."}
          </p>
          <Link href="/#properties" className="auth-btn primary" style={{ marginTop: 16 }}>
            Evlərə qayıt
          </Link>
        </div>
      </section>
    );
  }

  return (
    <PropertyDetailClient property={property} mapsUrl={mapsUrl} gallery={gallery} />
  );
}
