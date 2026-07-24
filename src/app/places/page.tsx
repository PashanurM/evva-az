import { notFound } from "next/navigation";
import { mapApiPlace } from "@/lib/mappers";
import { getPlaces, getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";
import { PlacesPageClient } from "./PlacesPageClient";

export const metadata = pageMetadata.places;

interface PlacesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const params = await searchParams;
  const pick = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = {
    q: pick("q"),
    category: pick("category"),
    sort: pick("sort") || "featured",
  };

  const [config, listing] = await Promise.all([
    getSiteConfig(),
    getPlaces(filters),
  ]);
  if (!config.modules.places) notFound();

  const places = listing.items.map(mapApiPlace);

  return (
    <PlacesPageClient
      places={places}
      categories={listing.categories}
      filters={filters}
    />
  );
}
