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
  base_role?: "user" | "owner" | "admin";
  view_mode?: "user" | "owner" | "admin";
  role_text: string;
  profile_image: string;
  owner_login_id: string;
  can_switch_owner: boolean;
  has_owner_properties?: boolean;
  is_verified: boolean;
  is_approved: boolean;
  wallet_balance?: number;
  role_links: Array<{ url: string; label: string; icon: string; mode?: string }>;
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
  rating_summary?: PropertyRatingSummary;
  reviews?: PropertyReview[];
  can_rate?: boolean;
  has_confirmed_booking?: boolean;
  user_rating?: PropertyUserRating | null;
  is_favorite: boolean;
  created_at: string;
  images?: Array<{ path: string; url: string }>;
  map_address?: string;
  house_rules?: string;
  cancellation_policy?: string;
  available_next_7_days?: boolean;
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
    avg_rating?: number;
    rating_count?: number;
    response_rate?: number | null;
    avg_response_hours?: number | null;
    approval_rate?: number | null;
  };
}

export interface PropertyRatingSummary {
  avg_rating: number;
  rating_count: number;
  cleanliness_avg: number;
  location_avg: number;
  comfort_avg: number;
  value_avg?: number;
  homeowner_avg: number;
}

export interface PropertyUserRating {
  rating: number;
  cleanliness_rating: number;
  location_rating: number;
  comfort_rating: number;
  value_rating?: number;
  homeowner_rating: number;
  comment: string;
  has_rated?: boolean;
}

export interface PropertyReview {
  rating: number;
  cleanliness_rating: number;
  location_rating: number;
  comfort_rating: number;
  value_rating?: number;
  homeowner_rating: number;
  comment: string;
  created_at: string;
  updated_at?: string;
  full_name: string;
  username: string;
  profile_image: string;
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
  owner_id?: string;
}

export interface PublicOwnerProfile {
  owner: {
    id: number;
    name: string;
    bio: string;
    profile_image: string;
    profile_image_url: string;
    created_at: string;
  };
  stats: {
    property_count: number;
    total_views: number;
    approved_bookings: number;
    avg_rating: number;
    rating_count: number;
    response_rate?: number | null;
    avg_response_hours?: number | null;
    approval_rate?: number | null;
  };
  properties: Property[];
  total: number;
}

export interface Restaurant {
  id: number;
  name: string;
  slug: string;
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
  latitude?: number | null;
  longitude?: number | null;
  whatsapp?: string;
  local_foods?: string;
  foreign_foods?: string;
  desserts?: string;
  drinks?: string;
  discount_text?: string;
  images?: Array<{ path: string; url: string }>;
  menu?: RestaurantMenuCategoryPublic[];
  meal_sets?: RestaurantMenuCategoryPublic[];
}

export interface RestaurantMenuItemPublic {
  id: number;
  title: string;
  ingredients?: string;
  description?: string;
  price: number;
  image_url?: string;
  image_path?: string;
  is_featured?: boolean;
}

export interface RestaurantMenuCategoryPublic {
  id: number;
  title: string;
  kind: "menu" | "meal_set";
  items: RestaurantMenuItemPublic[];
}

export interface RestaurantListResult {
  items: Restaurant[];
  total: number;
  locations: string[];
}

export interface PlaceCampaign {
  active: boolean;
  title: string;
  badge?: string | null;
  text?: string;
  until?: string | null;
}

export interface Place {
  id: number;
  title: string;
  slug: string;
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
  latitude?: number | null;
  longitude?: number | null;
  images?: Array<{ path: string; url: string }>;
  activities?: Array<{
    name: string;
    price: number;
    image?: string;
  }>;
  campaign?: PlaceCampaign | null;
  campaign_active?: boolean;
  campaign_title?: string;
  campaign_badge?: string;
  campaign_text?: string;
  campaign_until?: string | null;
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
  guest_area_note?: string;
  categories?: DeliveryCategory[];
  products?: DeliveryProduct[];
  settings?: {
    min_order_amount: number;
    free_delivery_threshold: number;
    service_area_text?: string;
  };
}

export interface DeliveryCategory {
  id: number;
  name: string;
  sort_order: number;
}

export interface DeliveryProduct {
  id: number;
  category_id: number;
  name: string;
  description: string;
  image: string;
  image_url: string;
  price: number;
  unit: string;
  available: number;
}

export interface DeliveryHouseListResult {
  items: DeliveryHouse[];
  total: number;
}

export interface MyDeliveryHouse {
  id: number;
  title: string;
  address: string;
  delivery_fee: number;
  property_id: number;
  guest_area_note?: string;
  booking?: {
    check_in: string;
    check_out: string;
    status: string;
  };
}

export interface DeliveryOrderResult {
  id: number;
  order_code: string;
  tracking_token: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  confirmation_code: string;
  house: { id: number; title: string };
}

export interface DeliveryTrackedOrder {
  id: number;
  order_code: string;
  tracking_token: string;
  status: string;
  payment_status: string;
  payment_method: string;
  guest_name: string;
  guest_phone: string;
  note: string;
  total_amount: number;
  delivery_fee: number;
  grand_total: number;
  confirmation_code: string;
  created_at: string;
  house: { id: number; title: string; address: string };
  items: Array<{
    product_id: number;
    product_name: string;
    unit_price: number;
    quantity: number;
    subtotal: number;
  }>;
  history: Array<{
    old_status: string | null;
    new_status: string;
    note: string;
    created_at: string;
  }>;
}
