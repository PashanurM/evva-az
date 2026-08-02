import { SiteVisitTracker } from "@/components/home/SiteVisitTracker";
import { HomeHub } from "@/components/home/HomeHub";
import { BottomCta } from "@/components/home/BottomCta";
import { assetUrl } from "@/lib/assets";
import { mapApiProperty } from "@/lib/mappers";
import { getPlaces, getProperties, getProperty, getRestaurants, getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.home;

function sliceStory(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function pickWeekPick(
  items: Awaited<ReturnType<typeof getProperties>>["items"],
  topIds: Set<number>,
) {
  const featuredFirst = [...items].sort((a, b) => {
    const aScore = a.is_premium || a.is_featured ? 1 : 0;
    const bScore = b.is_premium || b.is_featured ? 1 : 0;
    return bScore - aScore;
  });

  const outsideTop = featuredFirst.find((item) => !topIds.has(Number(item.id)));
  if (outsideTop) return outsideTop;
  if (items.length > 3) return items[3];
  return null;
}

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

  const topIds = new Set(topHomesSource.map((item) => Number(item.id)));
  const weekPickRaw = pickWeekPick(homesListing.items, topIds);

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

  const weekPick = weekPickRaw
    ? (() => {
        const mapped = mapApiProperty(weekPickRaw);
        return {
          id: mapped.id,
          title: mapped.title,
          location: mapped.location,
          price: mapped.price,
          image: mapped.image,
          story: sliceStory(mapped.description || weekPickRaw.description || mapped.title),
        };
      })()
    : null;

  const propertyDetails = await Promise.all(
    topHomesSource.slice(0, 3).map((item) => getProperty(Number(item.id))),
  );

  const reviews = propertyDetails
    .flatMap((property) => {
      if (!property) return [];
      const mapped = mapApiProperty(property);
      return (mapped.reviews || [])
        .filter((review) => review.comment?.trim())
        .map((review) => ({
          comment: review.comment.trim(),
          full_name: review.full_name || review.username || "",
          propertyTitle: mapped.title,
          propertyId: mapped.id,
          rating: review.rating,
        }));
    })
    .slice(0, 6);

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
        weekPick={weekPick}
        reviews={reviews}
        restaurants={restaurants}
        places={places}
        modules={config.modules}
      />
      <BottomCta />
    </>
  );
}
