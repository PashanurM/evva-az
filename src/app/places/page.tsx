import { notFound } from "next/navigation";
import { assetUrl } from "@/lib/assets";
import { mapApiPlace } from "@/lib/mappers";
import { getPlaces, getRestaurants, getSiteConfig } from "@/lib/server-api";
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

  const campaigns = places
    .filter((place) => place.campaign?.active)
    .slice(0, 6)
    .map((place) => ({
      id: place.id,
      title: place.title,
      slug: place.slug,
      location: place.location,
      cover_url: place.image || "",
      campaign: place.campaign!,
    }));

  const dayRoutePlaces = listing.items.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    location: item.location,
    cover_url: assetUrl(item.cover_url || item.cover_path || ""),
  }));

  let dayRouteRestaurant: {
    id: number;
    name: string;
    slug: string;
    location: string;
  } | null = null;

  if (config.modules.restaurants) {
    const restaurants = await getRestaurants({ sort: "rating" });
    const first = restaurants.items[0];
    if (first) {
      dayRouteRestaurant = {
        id: first.id,
        name: first.name,
        slug: first.slug,
        location: first.location,
      };
    }
  }

  return (
    <PlacesPageClient
      places={places}
      categories={listing.categories}
      filters={filters}
      campaigns={campaigns}
      dayRoute={{
        places: dayRoutePlaces,
        restaurant: dayRouteRestaurant,
      }}
    />
  );
}
