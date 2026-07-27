import { cache } from "react";
import type {
  ApiResponse,
  DeliveryHouseListResult,
  Place,
  PlaceListResult,
  Property,
  PropertyFilters,
  PropertyListResult,
  PublicOwnerProfile,
  Restaurant,
  RestaurantListResult,
  SiteConfig,
} from "./types";
import { getApiBackendBase } from "./api-base";
import { backendFetch } from "./backend-fetch";
import { entityIdFromKey } from "./slug";

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

/** Public SSR reads — soft-cached so detail navigations stay snappy. */
async function serverFetch<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const res = await backendFetch(`/api/v1${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate },
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

export const getSiteConfig = cache(async (): Promise<SiteConfig> => {
  return (
    (await serverFetch<SiteConfig>("/config/site", 120)) || {
      site_name: "EVVA.AZ",
      site_url: "https://evva.az",
      modules: { restaurants: true, places: true, delivery: true },
      tag_options: {},
      locations: ["Mərkəz", "Vəndam", "Bum", "Nic", "Qəmərvan"],
    }
  );
});

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

export const getProperty = cache(async (id: number): Promise<Property | null> => {
  const direct = await serverFetch<Property>(`/properties/${id}`);
  if (direct?.id) return normalizeProperty(direct);

  // Detail endpoint currently fatals on Alwaysdata when helpers.php is stale.
  // Rebuild from the working list endpoint so /property/[id] never hard-404s.
  const backend = getApiBackendBase();
  try {
    const res = await backendFetch(`${backend}/api/v1/properties`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });
    const json = await parseJsonResponse<PropertyListResult>(res);
    const item = json?.data?.items?.find((row) => Number(row.id) === id);
    if (!json?.success || !item) return null;
    return normalizeProperty(item);
  } catch {
    return null;
  }
});

export const getPublicOwner = cache(async (id: number): Promise<PublicOwnerProfile | null> => {
  if (!Number.isFinite(id) || id <= 0) return null;

  const data = await serverFetch<PublicOwnerProfile>(`/owners/${id}`);
  if (data?.owner?.id) {
    return {
      ...data,
      properties: (data.properties || []).map(normalizeProperty),
    };
  }

  // Fallback when /owners/{id} is not deployed yet (e.g. Alwaysdata lagging local PHP).
  return buildPublicOwnerFromProperties(id);
});

async function buildPublicOwnerFromProperties(ownerId: number): Promise<PublicOwnerProfile | null> {
  const listed = await getProperties({ sort: "newest" });
  const candidates = listed.items || [];
  if (candidates.length === 0) return null;

  const details = await Promise.all(
    candidates.slice(0, 60).map((item) => getProperty(Number(item.id))),
  );

  const owned = details.filter(
    (item): item is Property =>
      !!item && Number(item.owner?.id) === ownerId,
  );

  if (owned.length === 0) return null;

  const owner = owned[0].owner!;
  const profileImage = owner.profile_image || "";

  return {
    owner: {
      id: owner.id,
      name: owner.name || "",
      bio: owner.bio || "",
      profile_image: profileImage,
      profile_image_url: profileImage,
      created_at: owned[0].created_at || "",
    },
    stats: {
      property_count: owned.length,
      total_views: owned.reduce((sum, item) => sum + (item.views || 0), 0),
      approved_bookings: 0,
      avg_rating: 0,
      rating_count: 0,
    },
    properties: owned.map(normalizeProperty),
    total: owned.length,
  };
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

export const getRestaurant = cache(async (idOrSlug: number | string): Promise<Restaurant | null> => {
  const key = String(idOrSlug).trim();
  if (!key) return null;

  // Prefer numeric id (slug URLs end with -{id}). Works even if the API
  // has not deployed slug lookup yet.
  const id = entityIdFromKey(key);
  if (id != null) {
    const byId = await serverFetch<Restaurant>(`/restaurants/${id}`);
    if (byId) return byId;
  }

  if (!/^\d+$/.test(key)) {
    return serverFetch<Restaurant>(`/restaurants/${encodeURIComponent(key)}`);
  }
  return null;
});

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

export const getPlace = cache(async (idOrSlug: number | string): Promise<Place | null> => {
  const key = String(idOrSlug).trim();
  if (!key) return null;

  const id = entityIdFromKey(key);
  if (id != null) {
    const byId = await serverFetch<Place>(`/places/${id}`);
    if (byId) return byId;
  }

  if (!/^\d+$/.test(key)) {
    return serverFetch<Place>(`/places/${encodeURIComponent(key)}`);
  }
  return null;
});

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
