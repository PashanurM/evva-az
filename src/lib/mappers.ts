import { assetUrl } from "@/lib/assets";
import { resolvePropertyCoordinates } from "@/lib/location-coords";
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
    property.location,
  );

  return {
    id: property.id,
    title: property.title,
    location: property.location,
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
        }
      : undefined,
    rating: property.avg_rating,
    description: property.description,
    tags: property.tags,
    image: assetUrl(property.cover_url || property.cover_path),
    images: property.images?.map((img) => assetUrl(img.url || img.path)),
    lat: coords?.lat ?? 0,
    lng: coords?.lng ?? 0,
    premium: property.is_premium,
    occupiedRanges: property.occupied_ranges || property.booked_ranges || [],
  };
}

export function mapApiRestaurant(restaurant: ApiRestaurant): Restaurant {
  return {
    id: restaurant.id,
    title: restaurant.name,
    location: restaurant.location,
    premium: restaurant.is_featured,
    image: assetUrl(restaurant.cover_url || restaurant.cover_path),
    rating: restaurant.avg_rating,
  };
}

export function mapApiPlace(place: ApiPlace): Place {
  const cover = assetUrl(place.cover_url || place.cover_path);

  return {
    id: place.id,
    title: place.title,
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
  };
}
