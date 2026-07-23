export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  meta?: Record<string, unknown>;
}

export interface SiteConfig {
  site_name: string;
  site_url: string;
  modules: {
    restaurants: boolean;
    places: boolean;
    delivery: boolean;
  };
  tag_options: Record<string, string>;
  locations: string[];
}

export interface User {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  role: "user" | "owner" | "admin";
  role_text: string;
  profile_image: string;
  owner_login_id: string;
  can_switch_owner: boolean;
  is_verified: boolean;
  is_approved: boolean;
  role_links: Array<{ url: string; label: string; icon: string }>;
}

export interface Property {
  id: number;
  title: string;
  location: string;
  price: number;
  rooms: number;
  bathrooms: number;
  capacity: number;
  description: string;
  tags: string[];
  cover_path: string;
  cover_url: string;
  latitude: number | null;
  longitude: number | null;
  views: number;
  single_beds: number;
  double_beds: number;
  sofa_beds: number;
  minimum_nights: number;
  check_in_time: string;
  check_out_time: string;
  is_premium: boolean;
  is_featured: boolean;
  avg_rating: number;
  rating_count: number;
  is_favorite: boolean;
  created_at: string;
  images?: Array<{ path: string; url: string }>;
  map_address?: string;
  occupied_ranges?: Array<{
    check_in: string;
    check_out: string;
    source?: string;
  }>;
  blocked_dates?: string[];
  booked_ranges?: Array<{
    check_in: string;
    check_out: string;
    source?: string;
  }>;
  owner?: {
    id: number;
    name: string;
    phone: string;
    username: string;
    profile_image: string;
    bio: string;
  };
}

export interface PropertyListResult {
  items: Property[];
  top_rated: Property[];
  total: number;
  filters: Record<string, string | string[]>;
}

export interface PropertyFilters {
  search?: string;
  min_price?: string;
  max_price?: string;
  min_rooms?: string;
  min_bathrooms?: string;
  location?: string;
  check_in?: string;
  check_out?: string;
  sort?: string;
  tags?: string[];
}

export interface Restaurant {
  id: number;
  name: string;
  short_description: string;
  location: string;
  cover_path: string;
  cover_url: string;
  avg_rating: number;
  rating_count: number;
  is_featured: boolean;
  description?: string;
  address?: string;
  phone?: string;
  opening_hours?: string;
  cuisine_tags?: string;
  average_price?: number;
}

export interface RestaurantListResult {
  items: Restaurant[];
  total: number;
  locations: string[];
}

export interface Place {
  id: number;
  title: string;
  short_description: string;
  category: string;
  location: string;
  cover_path: string;
  cover_url: string;
  entry_price: number;
  avg_rating: number;
  rating_count: number;
  is_featured: boolean;
  description?: string;
  address?: string;
  phone?: string;
  working_hours?: string;
  tips?: string;
  images?: Array<{ path: string; url: string }>;
  activities?: Array<{
    name: string;
    price: number;
    image?: string;
  }>;
}

export interface PlaceListResult {
  items: Place[];
  total: number;
  categories: string[];
}

export interface DeliveryHouse {
  id: number;
  title: string;
  address: string;
  delivery_fee: number;
  property_id: number;
}

export interface DeliveryHouseListResult {
  items: DeliveryHouse[];
  total: number;
}
