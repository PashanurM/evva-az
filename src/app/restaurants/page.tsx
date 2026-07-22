import { notFound } from "next/navigation";
import { mapApiRestaurant } from "@/lib/mappers";
import { getRestaurants, getSiteConfig } from "@/lib/server-api";
import { assetUrl } from "@/lib/assets";
import { pageMetadata } from "@/lib/site-metadata";
import { RestaurantsPageClient } from "./RestaurantsPageClient";

export const metadata = pageMetadata.restaurants;

interface RestaurantsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RestaurantsPage({ searchParams }: RestaurantsPageProps) {
  const config = await getSiteConfig();
  if (!config.modules.restaurants) notFound();

  const params = await searchParams;
  const pick = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const filters = {
    q: pick("q"),
    location: pick("location"),
    sort: pick("sort") || "featured",
  };

  const listing = await getRestaurants(filters);
  const restaurants = listing.items.map((item) => {
    const mapped = mapApiRestaurant(item);
    return {
      id: mapped.id,
      title: mapped.title,
      location: mapped.location,
      premium: Boolean(mapped.premium),
      rating: mapped.rating,
      image: assetUrl(item.cover_url || item.cover_path || ""),
    };
  });

  return (
    <RestaurantsPageClient
      restaurants={restaurants}
      locations={listing.locations}
      filters={filters}
    />
  );
}
