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
  User,
} from "./types";
import { assetUrl } from "./assets";

export { assetUrl };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

let csrfTokenCache: string | null = null;

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  const data = (await res.json()) as ApiResponse<T>;
  data.status = res.status;
  if (!res.ok && !data.error) {
    data.error = `HTTP ${res.status}`;
    data.success = false;
  }
  return data;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  needsCsrf = false,
): Promise<ApiResponse<T>> {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  async function ensureCsrf(force = false) {
    if (!needsCsrf) return;
    if (force) csrfTokenCache = null;
    if (!csrfTokenCache) {
      const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
        credentials: "include",
        cache: "no-store",
      });
      const csrfData = await parseJson<{ csrf_token: string }>(csrfRes);
      csrfTokenCache = csrfData.data?.csrf_token || null;
    }
    if (csrfTokenCache) {
      headers.set("X-CSRF-TOKEN", csrfTokenCache);
    }
  }

  await ensureCsrf();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  if (needsCsrf && (res.status === 403 || res.status === 419)) {
    await ensureCsrf(true);
    const retry = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
    return parseJson<T>(retry);
  }

  return parseJson<T>(res);
}

function toQuery<F extends object>(
  filters: F,
  arraySuffix = "[]",
): string {
  const params = new URLSearchParams();
  Object.entries(filters as Record<string, string | string[] | undefined>).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(`${key}${arraySuffix}`, v));
    } else {
      params.set(key, value);
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const api = {
  getSiteConfig: () => apiFetch<SiteConfig>("/config/site"),

  getCsrf: () => apiFetch<{ csrf_token: string }>("/auth/csrf"),

  getMe: async () => {
    const site = await apiFetch<User>("/auth/me");
    if (site.success && site.data?.id) {
      return site;
    }

    // Admin panel sessions are separate; map them into the public auth shape.
    const admin = await apiFetch<{
      id: number;
      full_name?: string;
      username?: string;
      phone?: string;
      role?: string;
      profile_image?: string;
      owner_login_id?: string;
    }>("/admin/me");
    if (!admin.success || !admin.data?.id) {
      return site;
    }

    return {
      success: true,
      status: admin.status,
      data: {
        id: admin.data.id,
        full_name: admin.data.full_name || "",
        username: admin.data.username || "",
        phone: admin.data.phone || "",
        role: (admin.data.role as User["role"]) || "admin",
        role_text: "Admin",
        profile_image: admin.data.profile_image || "",
        owner_login_id: admin.data.owner_login_id || "",
        can_switch_owner: false,
        is_verified: true,
        is_approved: true,
        role_links: [],
      },
    };
  },

  login: (payload: {
    login_mode: "phone" | "username";
    phone?: string;
    username?: string;
    password: string;
  }) => {
    csrfTokenCache = null;
    return apiFetch<User>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }, true);
  },

  register: (payload: {
    phone: string;
    full_name: string;
    username: string;
    website?: string;
  }) =>
    apiFetch<{ message: string; requires_approval: boolean; request_id: number }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    ),

  logout: () => {
    csrfTokenCache = null;
    return apiFetch<{ message: string }>("/auth/logout", { method: "POST", body: "{}" }, true);
  },

  forgotPassword: (payload: {
    identifier: string;
    new_password: string;
    confirm_password: string;
  }) =>
    apiFetch<{ message: string }>(
      "/auth/forgot-password",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    ),

  getProperties: (filters: PropertyFilters = {}) =>
    apiFetch<PropertyListResult>(`/properties${toQuery(filters)}`),

  getProperty: (id: number) => apiFetch<Property>(`/properties/${id}`),

  toggleFavorite: (propertyId: number, action: "add" | "remove") =>
    apiFetch<{ action: string }>(
      "/favorites",
      {
        method: "POST",
        body: JSON.stringify({ property_id: propertyId, action }),
      },
      true,
    ),

  getFavorites: () => apiFetch<{ items: Property[]; total: number }>("/favorites"),

  getRestaurants: (filters: Record<string, string | undefined> = {}) =>
    apiFetch<RestaurantListResult>(`/restaurants${toQuery(filters, "")}`),

  getRestaurant: (id: number) => apiFetch<Restaurant>(`/restaurants/${id}`),

  getPlaces: (filters: Record<string, string | undefined> = {}) =>
    apiFetch<PlaceListResult>(`/places${toQuery(filters, "")}`),

  getPlace: (id: number) => apiFetch<Place>(`/places/${id}`),

  getDeliveryHouses: (filters: Record<string, string | undefined> = {}) =>
    apiFetch<DeliveryHouseListResult>(`/delivery/houses${toQuery(filters, "")}`),

  getOwnerProperties: () =>
    apiFetch<{
      items: Array<{
        id: number;
        title: string;
        location: string;
        price: number;
        capacity: number;
        rooms: number;
        views: number;
        booking_count: number;
        is_active: boolean;
        is_featured: boolean;
        cover_url: string;
        created_at: string;
      }>;
      total: number;
    }>("/owner/properties"),

  getOwnerProperty: (id: number) =>
    apiFetch<{
      property: {
        id: number;
        title: string;
        location: string;
        price: number;
        capacity: number;
        rooms: number;
        bathrooms: number;
        description: string;
        single_beds: number;
        double_beds: number;
        sofa_beds: number;
        minimum_nights: number;
        check_in_time: string;
        check_out_time: string;
        map_address: string;
        latitude: number | null;
        longitude: number | null;
        house_rules: string;
        cancellation_policy: string;
        is_active: boolean;
        is_featured: boolean;
        tags_list: string[];
        wifi: boolean;
        parking: boolean;
        kitchen: boolean;
        air_conditioner: boolean;
        heating: boolean;
        washing_machine: boolean;
        barbecue: boolean;
        heated_pool: boolean;
        children_allowed: boolean;
        pets_allowed: boolean;
        blocked_dates: string[];
        occupied_ranges: Array<{
          check_in: string;
          check_out: string;
          source?: string;
        }>;
      };
      tags: string[];
    }>(`/owner/properties/${id}`),

  updateOwnerProperty: (id: number, payload: Record<string, unknown>) =>
    apiFetch<{ message: string; id: number; property_id: number }>(
      `/owner/properties/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      true,
    ),

  saveOwnerBlockedDates: (id: number, dates: string[]) =>
    apiFetch<{ message: string; items: string[]; total: number }>(
      `/owner/properties/${id}/blocked-dates`,
      { method: "PUT", body: JSON.stringify({ dates }) },
      true,
    ),

  getMyConversations: () =>
    apiFetch<{
      items: Array<{
        id: number;
        property_id: number;
        property_title: string;
        status: string;
        guest_name: string;
        owner_name: string;
        last_message: string;
        updated_at: string;
      }>;
      total: number;
    }>("/chat/conversations"),

  startChat: (propertyId: number) =>
    apiFetch<{
      id: number;
      property_id: number;
      property_title: string;
      guest_name: string;
      owner_name: string;
      messages: ChatMessage[];
      total_messages: number;
    }>(
      "/chat/start",
      { method: "POST", body: JSON.stringify({ property_id: propertyId }) },
      true,
    ),

  getConversation: (conversationId: number) =>
    apiFetch<{
      id: number;
      property_id: number;
      property_title: string;
      guest_name: string;
      owner_name: string;
      messages: ChatMessage[];
      total_messages: number;
    }>(`/chat/conversations/${conversationId}`),

  sendChatMessage: (conversationId: number, message: string) =>
    apiFetch<{
      message: string;
      message_id: number;
      conversation: {
        id: number;
        property_id: number;
        property_title: string;
        messages: ChatMessage[];
        total_messages: number;
      };
    }>(
      `/chat/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ message }) },
      true,
    ),

  createBooking: (payload: {
    property_id: number;
    check_in: string;
    check_out: string;
    guest_count: number;
    note?: string;
    guest_name?: string;
    guest_phone?: string;
  }) =>
    apiFetch<{
      message: string;
      booking_id: number;
      conversation_id: number;
      property_id: number;
      status: string;
    }>("/bookings", { method: "POST", body: JSON.stringify(payload) }, true),

  getOwnerBookings: () =>
    apiFetch<{
      items: Array<{
        id: number;
        property_id: number;
        property_title: string;
        status: string;
        payment_status: string;
        check_in: string;
        check_out: string;
        guest_name: string;
        guest_phone: string;
        guest_count: number;
        note: string;
        created_at: string;
      }>;
      total: number;
    }>("/owner/bookings"),

  updateProfile: (username: string) =>
    apiFetch<{ message: string; user: User }>(
      "/auth/profile",
      { method: "PUT", body: JSON.stringify({ username }) },
      true,
    ),

  changePassword: (payload: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) =>
    apiFetch<{ message: string }>(
      "/auth/change-password",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    ),
};

type ChatMessage = {
  id: number;
  sender_user_id: number;
  receiver_user_id: number;
  message: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
  sender_role: string;
  is_mine: boolean;
};
