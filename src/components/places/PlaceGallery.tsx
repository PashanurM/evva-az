"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

interface PlaceGalleryProps {
  images: string[];
  title: string;
}

export function PlaceGallery({ images, title }: PlaceGalleryProps) {
  const { t } = useLocale();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const close = useCallback(() => setLightboxIndex(null), []);

  const move = useCallback(
    (delta: number) => {
      if (lightboxIndex === null) return;
      setLightboxIndex((lightboxIndex + delta + images.length) % images.length);
    },
    [lightboxIndex, images.length],
  );

  useEffect(() => {
    if (lightboxIndex === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [lightboxIndex, close, move]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="place-gallery">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            className={`place-gallery-item ${i === 0 ? "place-gallery-main" : ""}`}
            onClick={() => setLightboxIndex(i)}
            aria-label={t("places.galleryImage", { title, index: i + 1 })}
          >
            <Image
              src={src}
              alt={`${title} ${i + 1}`}
              width={600}
              height={400}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div
          className="place-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t("places.galleryLabel", { title })}
          onClick={close}
        >
          <button
            type="button"
            className="place-lightbox-close"
            onClick={close}
            aria-label={t("common.close")}
          >
            <X size={28} />
          </button>
          <button
            type="button"
            className="place-lightbox-nav place-lightbox-prev"
            onClick={(e) => {
              e.stopPropagation();
              move(-1);
            }}
            aria-label={t("places.galleryPrev")}
          >
            <ChevronLeft size={40} />
          </button>
          <Image
            src={images[lightboxIndex]}
            alt={title}
            width={1200}
            height={800}
            className="place-lightbox-image"
            onClick={(e) => e.stopPropagation()}
            unoptimized
          />
          <button
            type="button"
            className="place-lightbox-nav place-lightbox-next"
            onClick={(e) => {
              e.stopPropagation();
              move(1);
            }}
            aria-label={t("places.galleryNext")}
          >
            <ChevronRight size={40} />
          </button>
        </div>
      )}
    </>
  );
}
