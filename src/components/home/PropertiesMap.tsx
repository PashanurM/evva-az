"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { MapPropertyPoint } from "@/lib/map";

interface PropertiesMapProps {
  properties: MapPropertyPoint[];
}

export function PropertiesMap({ properties }: PropertiesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const fullscreenMapInstanceRef = useRef<LeafletMap | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [ready, setReady] = useState(false);

  const mappable = properties.filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng) && p.lat !== 0 && p.lng !== 0,
  );

  useEffect(() => {
    document.body.classList.toggle("map-fullscreen-open", fullscreen);
    return () => document.body.classList.remove("map-fullscreen-open");
  }, [fullscreen]);

  useEffect(() => {
    if (mappable.length === 0) return;

    let cancelled = false;

    async function buildMap(container: HTMLDivElement, storeRef: { current: LeafletMap | null }) {
      const L = (await import("leaflet")).default;

      if (cancelled) return null;

      if (storeRef.current) {
        storeRef.current.remove();
        storeRef.current = null;
      }

      const map = L.map(container, { scrollWheelZoom: false });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);

      mappable.forEach((property) => {
        const marker = L.marker([property.lat, property.lng]);
        marker.bindPopup(`
          <div class="map-popup">
            <strong>${escapeHtml(property.title)}</strong>
            <div>${escapeHtml(property.location)}</div>
            <div>${property.price} ₼/gecə</div>
            <a href="/property/${property.id}">Ətraflı bax</a>
          </div>
        `);
        marker.addTo(map);
        bounds.extend([property.lat, property.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      } else {
        map.setView([40.98, 47.85], 11);
      }

      storeRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
      return map;
    }

    async function initMaps() {
      await import("leaflet/dist/leaflet.css");

      if (mapRef.current) {
        await buildMap(mapRef.current, mapInstanceRef);
        setReady(true);
      }
    }

    initMaps();

    return () => {
      cancelled = true;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      fullscreenMapInstanceRef.current?.remove();
      fullscreenMapInstanceRef.current = null;
    };
  }, [mappable]);

  useEffect(() => {
    if (!fullscreen || !fullscreenMapRef.current || mappable.length === 0) return;

    let cancelled = false;

    async function initFullscreen() {
      const L = (await import("leaflet")).default;
      if (cancelled || !fullscreenMapRef.current) return;

      if (fullscreenMapInstanceRef.current) {
        fullscreenMapInstanceRef.current.remove();
        fullscreenMapInstanceRef.current = null;
      }

      const map = L.map(fullscreenMapRef.current, { scrollWheelZoom: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      mappable.forEach((property) => {
        const marker = L.marker([property.lat, property.lng]);
        marker.bindPopup(`<strong>${escapeHtml(property.title)}</strong>`);
        marker.addTo(map);
        bounds.extend([property.lat, property.lng]);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }

      fullscreenMapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 150);
    }

    initFullscreen();

    return () => {
      cancelled = true;
    };
  }, [fullscreen, mappable]);

  if (mappable.length === 0) {
    return null;
  }

  return (
    <section className="site-map-section" id="properties-map">
      <div className="container">
        <div className="site-map-card">
          <div className="site-map-head">
            <span className="section-kicker">Xəritə görünüşü</span>
            <h2>Bütün evləri xəritədə gör</h2>
            <p>Qeyd olunmuş evlər xəritədə də görünür.</p>
          </div>
          <div className="site-map-toolbar">
            <button type="button" className="auth-btn" onClick={() => setFullscreen(true)}>
              <i className="fas fa-expand" /> Full screen
            </button>
          </div>
          {!ready && (
            <div className="map-loading" style={{ padding: "12px 0" }}>
              <i className="fas fa-spinner fa-spin" /> Xəritə yüklənir...
            </div>
          )}
          <div ref={mapRef} id="allPropertiesMap" className="site-map" aria-label="Evlərin xəritəsi" />
        </div>
      </div>

      <div className="map-fullscreen-modal" hidden={!fullscreen}>
        <div className="map-fullscreen-shell">
          <div className="map-fullscreen-topbar">
            <div>
              <strong>Bütün evlər xəritədə</strong>
              <p>Daha geniş görünüş, rahat hərəkət və premium baxış.</p>
            </div>
            <button type="button" className="auth-btn" onClick={() => setFullscreen(false)}>
              <i className="fas fa-xmark" /> Bağla
            </button>
          </div>
          <div
            ref={fullscreenMapRef}
            id="allPropertiesMapFullscreen"
            className="site-map site-map-fullscreen"
          />
        </div>
      </div>
    </section>
  );
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
