import { notFound } from "next/navigation";
import { getRestaurant, getSiteConfig } from "@/lib/server-api";
import { assetUrl } from "@/lib/assets";
import { createDynamicMetadata, KEYWORDS, pageMetadata } from "@/lib/site-metadata";
import { RestaurantDetailClient } from "./RestaurantDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const restaurant = await getRestaurant(Number(id));
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
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isFinite(restaurantId) || restaurantId <= 0) notFound();

  const [config, restaurant] = await Promise.all([
    getSiteConfig(),
    getRestaurant(restaurantId),
  ]);

  if (!config.modules.restaurants || !restaurant) notFound();

  return (
    <RestaurantDetailClient
      restaurant={{
        ...restaurant,
        cover: assetUrl(restaurant.cover_url || restaurant.cover_path),
      }}
    />
  );
}
