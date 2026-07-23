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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Offset markers that share nearly the same coordinates so they don't stack. */
function spreadOverlapping(
  points: Array<{ id: number; lat: number; lng: number }>,
): Map<number, [number, number]> {
  const groups = new Map<string, typeof points>();
  for (const p of points) {
    const key = `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`;
    const list = groups.get(key) || [];
    list.push(p);
    groups.set(key, list);
  }

  const result = new Map<number, [number, number]>();
  for (const group of groups.values()) {
    if (group.length === 1) {
      result.set(group[0].id, [group[0].lat, group[0].lng]);
      continue;
    }
    const radius = 0.001 * Math.min(group.length, 8);
    group.forEach((item, index) => {
      const angle = (2 * Math.PI * index) / group.length - Math.PI / 2;
      result.set(item.id, [
        item.lat + radius * Math.cos(angle),
        item.lng + radius * Math.sin(angle),
      ]);
    });
  }
  return result;
}

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

      const map = L.map(container, {
        scrollWheelZoom: false,
        zoomControl: true,
      }).setView(center, 11);

      if (!active) {
        map.remove();
        return;
      }

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const positions = spreadOverlapping(
        mappable.map((p) => ({ id: p.id, lat: p.lat, lng: p.lng })),
      );

      const bounds: [number, number][] = [];

      mappable.forEach((item) => {
        const pos = positions.get(item.id) || ([item.lat, item.lng] as [number, number]);
        bounds.push(pos);

        const priceLabel = `${item.price} ₼`;
        const thumb = item.image
          ? `<img class="evva-map-popup-thumb" src="${escapeHtml(item.image)}" alt="" />`
          : "";
        const icon = L.divIcon({
          className: "evva-map-marker",
          html: `
            <div class="evva-map-marker-inner${item.premium ? " is-premium" : ""}" title="${escapeHtml(item.title)}">
              <span class="evva-map-marker-price">${escapeHtml(priceLabel)}</span>
            </div>
          `,
          iconSize: [64, 34],
          iconAnchor: [32, 34],
          popupAnchor: [0, -30],
        });

        const marker = L.marker(pos, { icon, riseOnHover: true }).addTo(map);
        marker.bindPopup(
          `
          <div class="evva-map-popup">
            ${thumb}
            <div class="evva-map-popup-body">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.location)} · <b>${escapeHtml(String(item.price))} ₼</b> ${escapeHtml(t("common.perNight"))}</p>
              <a href="/property/${item.id}">${escapeHtml(t("common.viewDetails"))}</a>
            </div>
          </div>
        `,
          { maxWidth: 260, className: "evva-map-popup-wrap" },
        );
      });

      if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      } else if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }

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
          {properties.length === 0 ? t("home.mapEmpty") : t("home.mapNoCoords")}
        </div>
      )}
    </div>
  );
}
