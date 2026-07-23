"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type LeafletContainer = HTMLElement & { _leaflet_id?: number };

const DEFAULT_CENTER: [number, number] = [40.9814, 47.8458];

type MapLocationPickerProps = {
  latitude: string;
  longitude: string;
  mapAddress?: string;
  onChange: (coords: { latitude: string; longitude: string; mapAddress?: string }) => void;
  height?: number;
  className?: string;
};

export function MapLocationPicker({
  latitude,
  longitude,
  mapAddress = "",
  onChange,
  height = 320,
  className,
}: MapLocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let active = true;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (!active) return;

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }

      const leafContainer = container as LeafletContainer;
      if (leafContainer._leaflet_id != null) {
        leafContainer.replaceChildren();
        delete leafContainer._leaflet_id;
      }

      const lat = Number(latitude);
      const lng = Number(longitude);
      const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
      const center: [number, number] = hasCoords ? [lat, lng] : DEFAULT_CENTER;

      const map = L.map(container, { scrollWheelZoom: false }).setView(center, hasCoords ? 14 : 12);
      if (!active) {
        map.remove();
        return;
      }
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const icon = L.divIcon({
        className: "evva-map-picker-icon",
        html: `<span class="evva-map-picker-pin"></span>`,
        iconSize: [28, 36],
        iconAnchor: [14, 34],
      });

      const marker = L.marker(center, { draggable: true, icon }).addTo(map);
      markerRef.current = marker;

      const sync = (latlng: { lat: number; lng: number }) => {
        onChangeRef.current({
          latitude: latlng.lat.toFixed(7),
          longitude: latlng.lng.toFixed(7),
        });
      };

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        sync(pos);
      });

      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        marker.setLatLng(e.latlng);
        sync(e.latlng);
      });

      setTimeout(() => {
        if (active && mapRef.current === map) map.invalidateSize();
      }, 120);
    })();

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Intentionally init once; external lat/lng sync handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!markerRef.current || !mapRef.current) return;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const current = markerRef.current.getLatLng();
    if (Math.abs(current.lat - lat) < 1e-7 && Math.abs(current.lng - lng) < 1e-7) return;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.setView([lat, lng], mapRef.current.getZoom());
  }, [latitude, longitude]);

  return (
    <div className={className ? `map-location-picker ${className}` : "map-location-picker"}>
      <div className="map-location-picker-fields">
        <label>
          Enlik (latitude)
          <input
            type="text"
            inputMode="decimal"
            value={latitude}
            onChange={(e) => onChange({ latitude: e.target.value, longitude, mapAddress })}
            placeholder="40.9814000"
          />
        </label>
        <label>
          Uzunluq (longitude)
          <input
            type="text"
            inputMode="decimal"
            value={longitude}
            onChange={(e) => onChange({ latitude, longitude: e.target.value, mapAddress })}
            placeholder="47.8458000"
          />
        </label>
        <label className="map-location-picker-address">
          Xəritə ünvanı
          <input
            type="text"
            value={mapAddress}
            onChange={(e) => onChange({ latitude, longitude, mapAddress: e.target.value })}
            placeholder="Küçə, kənd, əlavə izah..."
          />
        </label>
      </div>
      <div
        ref={containerRef}
        className="map-location-picker-map"
        style={{ height }}
        aria-label="Xəritədə məkan seç"
      />
      <small className="map-location-picker-hint">
        Xəritədə klik et və ya pin-i sürüklə — koordinatlar avtomatik dolacaq.
      </small>
    </div>
  );
}
