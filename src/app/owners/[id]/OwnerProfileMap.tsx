"use client";

import dynamic from "next/dynamic";
import type { Property } from "@/types";

const PropertyMap = dynamic(
  () => import("@/components/home/PropertyMap").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => (
      <div className="owner-profile-map owner-profile-map--loading">Xəritə yüklənir…</div>
    ),
  },
);

export function OwnerProfileMap({ properties }: { properties: Property[] }) {
  const mappable = properties.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0,
  );
  if (mappable.length === 0) return null;

  return (
    <section className="owner-profile-map-section glass">
      <div className="owner-profile-list-head" style={{ marginBottom: 14 }}>
        <h2>Xəritədə evlər</h2>
        <p>{mappable.length} məkan</p>
      </div>
      <PropertyMap
        properties={mappable}
        mapId={`owner-profile-map-${mappable[0]?.id || "all"}`}
        className="owner-profile-map"
      />
    </section>
  );
}
