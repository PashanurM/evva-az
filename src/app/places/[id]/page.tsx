import { notFound } from "next/navigation";
import { mapApiPlace } from "@/lib/mappers";
import { getPlace, getSiteConfig } from "@/lib/server-api";
import { createDynamicMetadata, KEYWORDS, pageMetadata } from "@/lib/site-metadata";
import { PlaceDetailClient } from "./PlaceDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const apiPlace = await getPlace(Number(id));
  if (!apiPlace) return pageMetadata.placeNotFound;
  return createDynamicMetadata({
    title: `${apiPlace.title} | EVVA.AZ`,
    description: apiPlace.short_description || apiPlace.description,
    keywords: [...KEYWORDS.places, apiPlace.title, ...(apiPlace.category ? [apiPlace.category] : [])],
  });
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const config = await getSiteConfig();
  if (!config.modules.places) notFound();

  const { id } = await params;
  const placeId = Number(id);
  if (!Number.isFinite(placeId) || placeId <= 0) notFound();

  const apiPlace = await getPlace(placeId);
  if (!apiPlace) notFound();

  const place = mapApiPlace(apiPlace);
  const images = place.images?.length
    ? place.images
    : place.image
      ? [place.image]
      : [];

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.location)}`;

  return (
    <PlaceDetailClient place={place} images={images} mapsUrl={mapsUrl} />
  );
}
