import type {
  ApiResponse,
  DeliveryHouseListResult,
  Place,
  PlaceListResult,
  Property,
  PropertyFilters,
  PropertyListResult,
  Restaurant,
  RestaurantListResult,
  SiteConfig,
} from "./types";
import { backendFetch } from "./backend-fetch";

function toQueryParams(filters: Record<string, string | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await backendFetch(`/api/v1${path}`, {
      headers: { Accept: "application/json" },
    });
    const json = (await res.json()) as ApiResponse<T>;
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

export async function getSiteConfig(): Promise<SiteConfig> {
  return (
    (await serverFetch<SiteConfig>("/config/site")) || {
      site_name: "EVVA.AZ",
      site_url: "https://evva.az",
      modules: { restaurants: true, places: true, delivery: true },
      tag_options: {},
      locations: ["Mərkəz", "Vəndam", "Bum", "Nic", "Qəmərvan"],
    }
  );
}

export async function getProperties(
  filters: PropertyFilters = {},
): Promise<PropertyListResult> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(`${key}[]`, v));
    } else {
      params.set(key, value);
    }
  });
  const qs = params.toString();
  return (
    (await serverFetch<PropertyListResult>(`/properties${qs ? `?${qs}` : ""}`)) || {
      items: [],
      top_rated: [],
      total: 0,
      filters: {},
    }
  );
}

export async function getProperty(id: number): Promise<Property | null> {
  return serverFetch<Property>(`/properties/${id}`);
}

export async function getRestaurants(filters: Record<string, string | undefined> = {}): Promise<RestaurantListResult> {
  return (
    (await serverFetch<RestaurantListResult>(`/restaurants${toQueryParams(filters)}`)) || {
      items: [],
      total: 0,
      locations: [],
    }
  );
}

export async function getRestaurant(id: number): Promise<Restaurant | null> {
  return serverFetch<Restaurant>(`/restaurants/${id}`);
}

export async function getPlaces(filters: Record<string, string | undefined> = {}): Promise<PlaceListResult> {
  return (
    (await serverFetch<PlaceListResult>(`/places${toQueryParams(filters)}`)) || {
      items: [],
      total: 0,
      categories: [],
    }
  );
}

export async function getPlace(id: number): Promise<Place | null> {
  return serverFetch<Place>(`/places/${id}`);
}

export async function getDeliveryHouses(filters: Record<string, string | undefined> = {}): Promise<DeliveryHouseListResult> {
  return (
    (await serverFetch<DeliveryHouseListResult>(`/delivery/houses${toQueryParams(filters)}`)) || {
      items: [],
      total: 0,
    }
  );
}
