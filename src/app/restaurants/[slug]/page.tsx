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

  const cover = assetUrl(restaurant.cover_url || restaurant.cover_path);
  const images = [
    ...(cover && !cover.endsWith("no-image.svg") ? [cover] : []),
    ...(restaurant.images || [])
      .map((image) => assetUrl(image.url || image.path))
      .filter((image) => Boolean(image) && image !== cover),
  ];

  const lat = restaurant.latitude != null ? Number(restaurant.latitude) : NaN;
  const lng = restaurant.longitude != null ? Number(restaurant.longitude) : NaN;
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
  const mapsQuery = hasCoords
    ? `${lat},${lng}`
    : restaurant.address || restaurant.location || "";
  const mapsUrl = mapsQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`
    : "";

  return (
    <RestaurantDetailClient
      restaurant={{
        id: restaurant.id,
        name: restaurant.name,
        location: restaurant.location,
        address: restaurant.address,
        opening_hours: restaurant.opening_hours,
        phone: restaurant.phone,
        whatsapp: restaurant.whatsapp,
        average_price: restaurant.average_price,
        avg_rating: restaurant.avg_rating,
        rating_count: restaurant.rating_count,
        is_featured: restaurant.is_featured,
        description: restaurant.description,
        short_description: restaurant.short_description,
        cuisine_tags: restaurant.cuisine_tags,
        discount_text: restaurant.discount_text,
        local_foods: restaurant.local_foods,
        foreign_foods: restaurant.foreign_foods,
        desserts: restaurant.desserts,
        drinks: restaurant.drinks,
        menu: restaurant.menu || [],
        meal_sets: restaurant.meal_sets || [],
        cover,
        images,
        mapsUrl,
      }}
    />
  );
}
