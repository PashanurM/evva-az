export interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  guests: number;
  rooms: number;
  bathrooms: number;
  views: number;
  createdAt?: string;
  singleBeds?: number;
  doubleBeds?: number;
  sofaBeds?: number;
  minimumNights?: number;
  checkInTime?: string;
  checkOutTime?: string;
  owner?: {
    id: number;
    name: string;
    username: string;
    profileImage: string;
    bio: string;
    avgRating?: number;
    ratingCount?: number;
  };
  rating: number;
  ratingCount?: number;
  ratingSummary?: {
    avg_rating: number;
    rating_count: number;
    cleanliness_avg: number;
    location_avg: number;
    comfort_avg: number;
    homeowner_avg: number;
  };
  reviews?: Array<{
    rating: number;
    cleanliness_rating: number;
    location_rating: number;
    comfort_rating: number;
    homeowner_rating: number;
    comment: string;
    created_at: string;
    full_name: string;
    username: string;
    profile_image: string;
  }>;
  canRate?: boolean;
  hasConfirmedBooking?: boolean;
  userRating?: {
    rating: number;
    cleanliness_rating: number;
    location_rating: number;
    comfort_rating: number;
    homeowner_rating: number;
    comment: string;
    has_rated?: boolean;
  } | null;
  description: string;
  houseRules?: string;
  cancellationPolicy?: string;
  mapAddress?: string;
  tags: string[];
  image: string;
  images?: string[];
  lat: number;
  lng: number;
  premium?: boolean;
  isFavorite?: boolean;
  bookedDays?: number[];
  occupiedRanges?: Array<{
    check_in: string;
    check_out: string;
    source?: string;
  }>;
}

export interface Restaurant {
  id: number;
  title: string;
  slug: string;
  location: string;
  premium?: boolean;
  image?: string;
  rating?: number;
}

export interface Place {
  id: number;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  location: string;
  address?: string;
  hours?: string;
  entryFee?: string;
  premium?: boolean;
  rating?: number;
  voteCount?: number;
  image?: string;
  images?: string[];
  activities?: Array<{
    name: string;
    price: number;
    image?: string;
  }>;
  lat?: number;
  lng?: number;
}

export type SortOption =
  | "newest"
  | "price_desc"
  | "price_asc"
  | "views_desc"
  | "rating_desc";

export interface SearchFilters {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  minBathrooms?: number;
  tags?: string[];
  sort?: SortOption;
}
