"use client";

import { useEffect, useRef, useState } from "react";
import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";
import "leaflet/dist/leaflet.css";

interface PropertyMapProps {
  properties: Property[];
  mapId?: string;
  className?: string;
  style?: React.CSSProperties;
}

type LeafletContainer = HTMLElement & { _leaflet_id?: number };

const GABALA_CENTER: [number, number] = [40.9814, 47.8458];

export function PropertyMap({
  properties,
  mapId = "evva-property-map",
  className,
  style,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const { t, locale } = useLocale();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const mappable = properties.filter(
      (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0,
    );

    let active = true;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const leafContainer = container as LeafletContainer;
      if (leafContainer._leaflet_id != null) {
        leafContainer.replaceChildren();
        delete leafContainer._leaflet_id;
      }

      const center =
        mappable.length > 0
          ? ([
              mappable.reduce((s, p) => s + p.lat, 0) / mappable.length,
              mappable.reduce((s, p) => s + p.lng, 0) / mappable.length,
            ] as [number, number])
          : GABALA_CENTER;

      const map = L.map(container, { scrollWheelZoom: false }).setView(center, 11);

      if (!active) {
        map.remove();
        return;
      }

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      mappable.forEach((item) => {
        const marker = L.marker([item.lat, item.lng]).addTo(map);
        marker.bindPopup(`
          <div style="min-width:200px">
            <strong>${item.title}</strong>
            <p style="margin:6px 0;color:#475569">${item.location} • ${item.price} ${t("common.perNight")}</p>
            <a href="/property/${item.id}" style="font-weight:800;color:#16a34a">${t("common.viewDetails")}</a>
          </div>
        `);
      });

      setStatus(mappable.length > 0 ? "ready" : "empty");

      setTimeout(() => {
        if (active && mapRef.current === map) {
          map.invalidateSize();
        }
      }, 100);
    })();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [properties, mapId, locale, t]);

  return (
    <div className="property-map-wrap" style={{ position: "relative", ...style }}>
      <div ref={containerRef} id={mapId} className={className} style={style} />
      {status === "empty" && (
        <div className="property-map-empty">
          {properties.length === 0
            ? t("home.mapEmpty")
            : t("home.mapNoCoords")}
        </div>
      )}
    </div>
  );
}
