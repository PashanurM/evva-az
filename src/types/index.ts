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
  };
  rating: number;
  description: string;
  tags: string[];
  image: string;
  images?: string[];
  lat: number;
  lng: number;
  premium?: boolean;
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
  location: string;
  premium?: boolean;
  image?: string;
  rating?: number;
}

export interface Place {
  id: number;
  title: string;
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
