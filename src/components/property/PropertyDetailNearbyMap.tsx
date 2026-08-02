"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Property } from "@/types";
import { api } from "@/lib/api";
import { haversineKm } from "@/lib/map";
import { entitySlug } from "@/lib/slug";
import { escapeLeafletHtml, loadLeaflet } from "@/lib/leaflet-setup";
import { useLocale } from "@/providers/LocaleProvider";
import "leaflet/dist/leaflet.css";

type NearbyPoint = {
  id: number;
  kind: "home" | "restaurant" | "place";
  title: string;
  lat: number;
  lng: number;
  href: string;
  subtitle?: string;
};

interface PropertyDetailNearbyMapProps {
  property: Property;
  mapId?: string;
  className?: string;
}

const GABALA_CENTER: [number, number] = [40.9814, 47.8458];
const NEARBY_RADIUS_KM = 25;

function pickNearby<T extends { lat?: number; lng?: number }>(
  items: T[],
  originLat: number,
  originLng: number,
  limit: number,
): T[] {
  const withDistance = items
    .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
    .map((item) => ({
      item,
      distance: haversineKm(originLat, originLng, item.lat!, item.lng!),
    }))
    .sort((a, b) => a.distance - b.distance);

  const nearby = withDistance.filter((row) => row.distance <= NEARBY_RADIUS_KM);
  const source = nearby.length > 0 ? nearby : withDistance;
  return source.slice(0, limit).map((row) => row.item);
}

export function PropertyDetailNearbyMap({
  property,
  mapId = "property-detail-nearby-map",
  className,
}: PropertyDetailNearbyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty">("loading");
  const [nearbyLinks, setNearbyLinks] = useState<NearbyPoint[]>([]);
  const { t } = useLocale();

  const hasCoords =
    Number.isFinite(property.lat) &&
    Number.isFinite(property.lng) &&
    property.lat !== 0 &&
    property.lng !== 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;

    void (async () => {
      const [restaurantsRes, placesRes] = await Promise.all([
        api.getRestaurants({ sort: "featured" }),
        api.getPlaces({ sort: "featured" }),
      ]);

      if (!active) return;

      const restaurants = restaurantsRes.data?.items || [];
      const places = placesRes.data?.items || [];

      const restaurantPoints = restaurants
        .map((item) => ({
          id: item.id,
          kind: "restaurant" as const,
          title: item.name,
          lat: item.latitude != null ? Number(item.latitude) : NaN,
          lng: item.longitude != null ? Number(item.longitude) : NaN,
          href: `/restaurants/${entitySlug({ id: item.id, slug: item.slug, name: item.name })}`,
          subtitle: item.location,
        }))
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

      const placePoints = places
        .map((item) => ({
          id: item.id,
          kind: "place" as const,
          title: item.title,
          lat: item.latitude != null ? Number(item.latitude) : NaN,
          lng: item.longitude != null ? Number(item.longitude) : NaN,
          href: `/places/${entitySlug({ id: item.id, slug: item.slug, title: item.title })}`,
          subtitle: item.location,
        }))
        .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng));

      const selectedRestaurants = hasCoords
        ? pickNearby(restaurantPoints, property.lat, property.lng, 3)
        : restaurantPoints.slice(0, 3);
      const selectedPlaces = hasCoords
        ? pickNearby(placePoints, property.lat, property.lng, 3)
        : placePoints.slice(0, 3);

      const points: NearbyPoint[] = [];
      if (hasCoords) {
        points.push({
          id: property.id,
          kind: "home",
          title: property.title,
          lat: property.lat,
          lng: property.lng,
          href: `/property/${property.id}`,
          subtitle: property.location,
        });
      }
      points.push(...selectedRestaurants, ...selectedPlaces);
      setNearbyLinks(points.filter((item) => item.kind !== "home"));

      const L = await loadLeaflet();
      if (!active) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const center: [number, number] = hasCoords
        ? [property.lat, property.lng]
        : points.length > 0
          ? [points[0].lat, points[0].lng]
          : GABALA_CENTER;

      const map = L.map(container, { scrollWheelZoom: false }).setView(center, 12);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap",
        maxZoom: 18,
      }).addTo(map);

      const bounds: [number, number][] = [];
      for (const point of points) {
        bounds.push([point.lat, point.lng]);
        const color =
          point.kind === "home" ? "#166534" : point.kind === "restaurant" ? "#ea580c" : "#2563eb";
        const marker = L.circleMarker([point.lat, point.lng], {
          radius: point.kind === "home" ? 10 : 8,
          color,
          fillColor: color,
          fillOpacity: 0.85,
          weight: 2,
        }).addTo(map);
        marker.bindPopup(
          `<div class="evva-map-popup"><strong>${escapeLeafletHtml(point.title)}</strong><p>${escapeLeafletHtml(point.subtitle || "")}</p><a href="${escapeLeafletHtml(point.href)}">${escapeLeafletHtml(t("common.viewDetails"))}</a></div>`,
        );
      }

      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [36, 36], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 14);
      }

      setStatus(points.length > 0 ? "ready" : "empty");
      setTimeout(() => map.invalidateSize(), 120);
    })();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [property, hasCoords, mapId, t]);

  return (
    <div className="property-nearby-map-wrap">
      <div ref={containerRef} id={mapId} className={className || "property-detail-map"} />
      {status === "empty" ? (
        <div className="property-map-empty">{t("property.nearbyMapEmpty")}</div>
      ) : null}
      {nearbyLinks.length > 0 ? (
        <div className="property-nearby-links">
          {nearbyLinks.map((point) => (
            <Link key={`${point.kind}-${point.id}`} href={point.href}>
              <span className={`property-nearby-pill property-nearby-pill--${point.kind}`}>
                {point.kind === "restaurant"
                  ? t("property.nearbyRestaurant")
                  : t("property.nearbyPlace")}
              </span>
              {point.title}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
