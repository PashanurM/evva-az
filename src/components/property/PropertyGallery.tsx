"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

interface PropertyGalleryProps {
  images: string[];
  title: string;
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const total = images.length;
  const safeIndex = total > 0 ? ((index % total) + total) % total : 0;
  const current = images[safeIndex] || "";

  const move = useCallback(
    (delta: number) => {
      if (total <= 1) return;
      setIndex((prev) => (prev + delta + total) % total);
    },
    [total],
  );

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    if (!lightboxOpen && total <= 1) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && lightboxOpen) {
        setLightboxOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, move, total]);

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxOpen]);

  if (total === 0 || !current) {
    return <div className="hero-image property-gallery-empty" aria-hidden />;
  }

  return (
    <>
      <div className="hero-image property-gallery">
        <button
          type="button"
          className="property-gallery-main"
          onClick={() => setLightboxOpen(true)}
          aria-label={t("property.galleryOpen")}
        >
          <Image
            src={current}
            alt={`${title} — ${safeIndex + 1}`}
            width={1200}
            height={700}
            className="property-gallery-main-image"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
            priority={safeIndex === 0}
            unoptimized
          />
        </button>

        {total > 1 ? (
          <>
            <button
              type="button"
              className="property-gallery-arrow property-gallery-arrow--left"
              onClick={() => move(-1)}
              aria-label={t("property.galleryPrev")}
            >
              <ChevronLeft size={22} aria-hidden />
            </button>
            <button
              type="button"
              className="property-gallery-arrow property-gallery-arrow--right"
              onClick={() => move(1)}
              aria-label={t("property.galleryNext")}
            >
              <ChevronRight size={22} aria-hidden />
            </button>
            <div className="property-gallery-counter" aria-live="polite">
              {t("property.galleryCounter", { current: safeIndex + 1, total })}
            </div>
            <button
              type="button"
              className="property-gallery-expand"
              onClick={() => setLightboxOpen(true)}
              aria-label={t("property.galleryOpen")}
            >
              <Expand size={16} aria-hidden />
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="property-gallery-thumbs" role="tablist" aria-label={title}>
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              className={`property-gallery-thumb${i === safeIndex ? " is-active" : ""}`}
              onClick={() => setIndex(i)}
            >
              <Image
                src={src}
                alt=""
                width={88}
                height={64}
                unoptimized
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div
          className="place-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="place-lightbox-close"
            onClick={() => setLightboxOpen(false)}
            aria-label={t("common.close")}
          >
            <X size={28} />
          </button>
          {total > 1 ? (
            <button
              type="button"
              className="place-lightbox-nav place-lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                move(-1);
              }}
              aria-label={t("property.galleryPrev")}
            >
              <ChevronLeft size={40} />
            </button>
          ) : null}
          <Image
            src={current}
            alt={title}
            width={1200}
            height={800}
            className="place-lightbox-image"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />
          {total > 1 ? (
            <button
              type="button"
              className="place-lightbox-nav place-lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                move(1);
              }}
              aria-label={t("property.galleryNext")}
            >
              <ChevronRight size={40} />
            </button>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
