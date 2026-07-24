import { notFound, permanentRedirect } from "next/navigation";
import { mapApiPlace } from "@/lib/mappers";
import { getPlace, getSiteConfig } from "@/lib/server-api";
import { entitySlug } from "@/lib/slug";
import { createDynamicMetadata, KEYWORDS, pageMetadata } from "@/lib/site-metadata";
import { PlaceDetailClient } from "./PlaceDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const apiPlace = await getPlace(decodeURIComponent(slug));
  if (!apiPlace) return pageMetadata.placeNotFound;
  return createDynamicMetadata({
    title: `${apiPlace.title} | EVVA.AZ`,
    description: apiPlace.short_description || apiPlace.description,
    keywords: [...KEYWORDS.places, apiPlace.title, ...(apiPlace.category ? [apiPlace.category] : [])],
  });
}

export default async function PlaceDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) notFound();

  const [config, apiPlace] = await Promise.all([
    getSiteConfig(),
    getPlace(slug),
  ]);

  if (!config.modules.places || !apiPlace) notFound();

  const canonicalSlug = entitySlug({
    id: apiPlace.id,
    slug: apiPlace.slug,
    title: apiPlace.title,
  });

  // Old /places/12 URLs and outdated slugs permanently redirect to the SEO path.
  if (slug !== canonicalSlug) {
    permanentRedirect(`/places/${canonicalSlug}`);
  }

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
