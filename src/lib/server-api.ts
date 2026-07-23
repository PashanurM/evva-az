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
import { getApiBackendBase } from "./api-base";
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

function looksLikeJsonText(text: string, contentType: string): boolean {
  if (contentType.includes("application/json")) return true;
  const head = text.trimStart().slice(0, 8);
  return head.startsWith("{") || head.startsWith("[");
}

async function parseJsonResponse<T>(res: Response): Promise<ApiResponse<T> | null> {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!looksLikeJsonText(text, contentType)) return null;
  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await backendFetch(`/api/v1${path}`, {
      headers: { Accept: "application/json" },
    });
    const json = await parseJsonResponse<T>(res);
    return json?.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

function normalizeProperty(item: Property): Property {
  return {
    ...item,
    occupied_ranges: item.occupied_ranges || [],
    blocked_dates: item.blocked_dates || [],
    booked_ranges: item.booked_ranges || [],
    images: item.images?.length
      ? item.images
      : item.cover_path || item.cover_url
        ? [{ path: item.cover_path, url: item.cover_url }]
        : [],
  };
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
  const direct = await serverFetch<Property>(`/properties/${id}`);
  if (direct?.id) return normalizeProperty(direct);

  // Detail endpoint currently fatals on Alwaysdata when helpers.php is stale.
  // Rebuild from the working list endpoint so /property/[id] never hard-404s.
  const backend = getApiBackendBase();
  try {
    const res = await backendFetch(`${backend}/api/v1/properties`, {
      headers: { Accept: "application/json" },
    });
    const json = await parseJsonResponse<PropertyListResult>(res);
    const item = json?.data?.items?.find((row) => Number(row.id) === id);
    if (!json?.success || !item) return null;
    return normalizeProperty(item);
  } catch {
    return null;
  }
}

export async function getRestaurants(
  filters: Record<string, string | undefined> = {},
): Promise<RestaurantListResult> {
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

export async function getPlaces(
  filters: Record<string, string | undefined> = {},
): Promise<PlaceListResult> {
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

export async function getDeliveryHouses(
  filters: Record<string, string | undefined> = {},
): Promise<DeliveryHouseListResult> {
  return (
    (await serverFetch<DeliveryHouseListResult>(
      `/delivery/houses${toQueryParams(filters)}`,
    )) || {
      items: [],
      total: 0,
    }
  );
}
