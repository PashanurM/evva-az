import { notFound, permanentRedirect } from "next/navigation";
import { getRestaurant, getSiteConfig } from "@/lib/server-api";
import { assetUrl } from "@/lib/assets";
import { entitySlug } from "@/lib/slug";
import { createDynamicMetadata, KEYWORDS, pageMetadata } from "@/lib/site-metadata";
import { RestaurantDetailClient } from "./RestaurantDetailClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const restaurant = await getRestaurant(decodeURIComponent(slug));
  if (!restaurant) return pageMetadata.restaurantNotFound;
  return createDynamicMetadata({
    title: `${restaurant.name} | EVVA.AZ`,
    description: restaurant.short_description || restaurant.description,
    keywords: [
      ...KEYWORDS.restaurants,
      restaurant.name,
      ...(restaurant.cuisine_tags ? [restaurant.cuisine_tags] : []),
    ],
  });
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug).trim();
  if (!slug) notFound();

  const [config, restaurant] = await Promise.all([
    getSiteConfig(),
    getRestaurant(slug),
  ]);

  if (!config.modules.restaurants || !restaurant) notFound();

  const canonicalSlug = entitySlug({
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
  });

  if (slug !== canonicalSlug) {
    permanentRedirect(`/restaurants/${canonicalSlug}`);
  }

  return (
    <RestaurantDetailClient
      restaurant={{
        ...restaurant,
        cover: assetUrl(restaurant.cover_url || restaurant.cover_path),
      }}
    />
  );
}
