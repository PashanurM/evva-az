import { assetUrl } from "@/lib/assets";
import { resolvePropertyCoordinates } from "@/lib/location-coords";
import { entitySlug } from "@/lib/slug";
import type {
  Place as ApiPlace,
  Property as ApiProperty,
  Restaurant as ApiRestaurant,
} from "@/lib/types";
import type { Place, Property, Restaurant } from "@/types";

export function mapApiProperty(property: ApiProperty): Property {
  const coords = resolvePropertyCoordinates(
    property.latitude,
    property.longitude,
    property.location || "",
  );

  return {
    id: property.id,
    title: property.title,
    location: property.location || "",
    price: property.price,
    guests: property.capacity,
    rooms: property.rooms,
    bathrooms: property.bathrooms,
    views: property.views,
    createdAt: property.created_at,
    singleBeds: property.single_beds,
    doubleBeds: property.double_beds,
    sofaBeds: property.sofa_beds,
    minimumNights: property.minimum_nights,
    checkInTime: property.check_in_time,
    checkOutTime: property.check_out_time,
    owner: property.owner
      ? {
          id: property.owner.id,
          name: property.owner.name,
          username: property.owner.username,
          profileImage: assetUrl(property.owner.profile_image),
          bio: property.owner.bio,
          avgRating: property.owner.avg_rating,
          ratingCount: property.owner.rating_count,
        }
      : undefined,
    rating: property.avg_rating,
    ratingCount: property.rating_count,
    ratingSummary: property.rating_summary
      ? {
          avg_rating: property.rating_summary.avg_rating,
          rating_count: property.rating_summary.rating_count,
          cleanliness_avg: property.rating_summary.cleanliness_avg,
          location_avg: property.rating_summary.location_avg,
          comfort_avg: property.rating_summary.comfort_avg,
          homeowner_avg: property.rating_summary.homeowner_avg,
        }
      : undefined,
    reviews: (property.reviews || []).map((review) => ({
      rating: review.rating,
      cleanliness_rating: review.cleanliness_rating,
      location_rating: review.location_rating,
      comfort_rating: review.comfort_rating,
      homeowner_rating: review.homeowner_rating,
      comment: review.comment,
      created_at: review.created_at,
      full_name: review.full_name,
      username: review.username,
      profile_image: assetUrl(review.profile_image),
    })),
    canRate: Boolean(property.can_rate),
    hasConfirmedBooking: Boolean(property.has_confirmed_booking),
    userRating: property.user_rating
      ? {
          rating: property.user_rating.rating,
          cleanliness_rating: property.user_rating.cleanliness_rating,
          location_rating: property.user_rating.location_rating,
          comfort_rating: property.user_rating.comfort_rating,
          homeowner_rating: property.user_rating.homeowner_rating,
          comment: property.user_rating.comment,
          has_rated: Boolean(property.user_rating.has_rated),
        }
      : null,
    description: property.description,
    houseRules: property.house_rules || "",
    cancellationPolicy: property.cancellation_policy || "",
    mapAddress: property.map_address || "",
    tags: property.tags || [],
    image: assetUrl(property.cover_url || property.cover_path),
    images: property.images?.map((img) => assetUrl(img.url || img.path)),
    lat: coords?.lat ?? 0,
    lng: coords?.lng ?? 0,
    premium: property.is_premium,
    isFavorite: Boolean(property.is_favorite),
    occupiedRanges: property.occupied_ranges || property.booked_ranges || [],
  };
}

export function mapApiRestaurant(restaurant: ApiRestaurant): Restaurant {
  return {
    id: restaurant.id,
    title: restaurant.name,
    slug: entitySlug({
      id: restaurant.id,
      slug: restaurant.slug,
      name: restaurant.name,
    }),
    location: restaurant.location,
    premium: restaurant.is_featured,
    image: assetUrl(restaurant.cover_url || restaurant.cover_path),
    rating: restaurant.avg_rating,
  };
}

export function mapApiPlace(place: ApiPlace): Place {
  const cover = assetUrl(place.cover_url || place.cover_path);
  const lat = place.latitude != null ? Number(place.latitude) : NaN;
  const lng = place.longitude != null ? Number(place.longitude) : NaN;

  return {
    id: place.id,
    title: place.title,
    slug: entitySlug({
      id: place.id,
      slug: place.slug,
      title: place.title,
    }),
    description: place.short_description,
    longDescription: place.description,
    category: place.category,
    location: place.location,
    address: place.address,
    hours: place.working_hours,
    entryFee: place.entry_price > 0 ? `${place.entry_price} ₼` : "Pulsuz",
    premium: place.is_featured,
    rating: place.avg_rating,
    voteCount: place.rating_count,
    image: cover,
    images: [
      ...(cover ? [cover] : []),
      ...(place.images || [])
        .map((image) => assetUrl(image.url || image.path))
        .filter((image) => Boolean(image) && image !== cover),
    ],
    activities: (place.activities || []).map((activity) => ({
      name: activity.name,
      price: Number(activity.price || 0),
      image: activity.image ? assetUrl(activity.image) : undefined,
    })),
    lat: Number.isFinite(lat) && lat !== 0 ? lat : undefined,
    lng: Number.isFinite(lng) && lng !== 0 ? lng : undefined,
  };
}
