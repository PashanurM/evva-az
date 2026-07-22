"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Expand, X } from "lucide-react";
import type { Property } from "@/types";
import { useLocale } from "@/providers/LocaleProvider";

function MapLoading() {
  const { t } = useLocale();
  return (
    <div
      className="site-map"
      style={{
        display: "grid",
        placeItems: "center",
        background: "var(--bg-tertiary)",
      }}
    >
      {t("home.mapLoading")}
    </div>
  );
}

const PropertyMap = dynamic(
  () => import("./PropertyMap").then((m) => m.PropertyMap),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

export function MapSection({ properties }: { properties: Property[] }) {
  const [fullscreen, setFullscreen] = useState(false);
  const { t } = useLocale();

  return (
    <section className="site-map-section">
      <div className="container">
        <div className="site-map-card">
          <div className="site-map-head">
            <span className="section-kicker">{t("home.mapKicker")}</span>
            <h2>{t("home.mapTitle")}</h2>
            <p>{t("home.mapSubtitle")}</p>
          </div>
          <div className="site-map-toolbar">
            <button
              type="button"
              className="auth-btn"
              onClick={() => setFullscreen(true)}
            >
              <Expand size={16} /> {t("home.mapFullscreen")}
            </button>
          </div>
          <PropertyMap properties={properties} className="site-map" />

          {fullscreen && (
            <div
              className="map-fullscreen-modal"
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 5000,
                background: "rgba(2,6,23,0.72)",
                backdropFilter: "blur(14px)",
                padding: 20,
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: 28,
                  overflow: "hidden",
                  display: "grid",
                  gridTemplateRows: "auto 1fr",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "18px 20px",
                    borderBottom: "1px solid var(--border-color)",
                  }}
                >
                  <div>
                    <strong>{t("home.mapFullscreenTitle")}</strong>
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)" }}>
                      {t("home.mapFullscreenSubtitle")}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="auth-btn"
                    onClick={() => setFullscreen(false)}
                  >
                    <X size={16} /> {t("common.close")}
                  </button>
                </div>
                <PropertyMap
                  properties={properties}
                  mapId="evva-property-map-fullscreen"
                  className="site-map"
                  style={{ height: "100%", minHeight: "calc(100vh - 130px)" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
