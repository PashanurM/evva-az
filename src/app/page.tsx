import { SiteVisitTracker } from "@/components/home/SiteVisitTracker";
import { HomeHub } from "@/components/home/HomeHub";
import { BottomCta } from "@/components/home/BottomCta";
import { assetUrl } from "@/lib/assets";
import { mapApiProperty } from "@/lib/mappers";
import { getPlaces, getProperties, getRestaurants, getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.home;

export default async function Home() {
  const [config, homesListing, restaurantsListing, placesListing] = await Promise.all([
    getSiteConfig(),
    getProperties({ sort: "rating_desc" }),
    getRestaurants({ sort: "rating" }),
    getPlaces({ sort: "rating" }),
  ]);

  const topHomesSource =
    homesListing.top_rated?.length > 0
      ? homesListing.top_rated.slice(0, 3)
      : homesListing.items.slice(0, 3);

  const homes = topHomesSource.map((item) => {
    const mapped = mapApiProperty(item);
    return {
      id: mapped.id,
      title: mapped.title,
      location: mapped.location,
      price: mapped.price,
      rating: mapped.rating || 0,
      ratingCount: mapped.ratingCount || 0,
      image: mapped.image,
    };
  });

  const restaurants = restaurantsListing.items.slice(0, 3).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    location: item.location,
    avg_rating: Number(item.avg_rating || 0),
    rating_count: Number(item.rating_count || 0),
    cover_url: assetUrl(item.cover_url || item.cover_path || ""),
  }));

  const places = placesListing.items.slice(0, 3).map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.slug,
    location: item.location,
    avg_rating: Number(item.avg_rating || 0),
    rating_count: Number(item.rating_count || 0),
    cover_url: assetUrl(item.cover_url || item.cover_path || ""),
  }));

  return (
    <>
      <SiteVisitTracker />
      <HomeHub
        homes={homes}
        restaurants={restaurants}
        places={places}
        modules={config.modules}
      />
      <BottomCta />
    </>
  );
}
