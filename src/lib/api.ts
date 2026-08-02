import type {
  ApiResponse,
  DeliveryHouse,
  DeliveryHouseListResult,
  DeliveryOrderResult,
  DeliveryTrackedOrder,
  Place,
  PlaceListResult,
  Property,
  PropertyFilters,
  PropertyListResult,
  PropertyRatingSummary,
  PropertyReview,
  PropertyUserRating,
  Restaurant,
  RestaurantListResult,
  SiteConfig,
  User,
} from "./types";
import { assetUrl } from "./assets";
import {
  compressImageAggressive,
  compressImageForUpload,
  httpStatusMessage,
} from "./image-compress";

export { assetUrl };

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
const UPLOAD_TIMEOUT_MS = 90_000;

export type OwnerPropertyImage = {
  id: number;
  image_path: string;
  url: string;
  is_cover?: boolean;
  sort_order?: number;
};

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
  // Let the browser set multipart boundary for FormData bodies.
  if (!(options.body instanceof FormData) && !headers.has("Content-Type") && options.body) {
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

async function postMultipart<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  try {
    return await apiFetch<T>(
      path,
      { method: "POST", body: formData, signal: controller.signal },
      true,
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { success: false, error: "Sorğu vaxtı bitdi. Yenidən cəhd edin." };
    }
    return { success: false, error: "Şəbəkə xətası. Yenidən cəhd edin." };
  } finally {
    clearTimeout(timer);
  }
}

async function uploadCompressedFile<T>(
  path: string,
  fieldName: string,
  file: File,
): Promise<ApiResponse<T>> {
  let prepared = await compressImageForUpload(file);
  let formData = new FormData();
  formData.append(fieldName, prepared);

  let res = await postMultipart<T>(path, formData);
  if (res.status === 413 || (!res.success && /413|böyük|too large/i.test(res.error || ""))) {
    prepared = await compressImageAggressive(prepared);
    formData = new FormData();
    formData.append(fieldName, prepared);
    res = await postMultipart<T>(path, formData);
  }
  if (!res.success && (res.status === 413 || !res.error)) {
    res.error = httpStatusMessage(res.status || 413);
  }
  return res;
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

  getMe: async (): Promise<ApiResponse<User>> => {
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
      role_text?: string;
      profile_image?: string;
      owner_login_id?: string;
      can_switch_owner?: boolean;
      has_owner_properties?: boolean;
      view_mode?: string;
      role_links?: User["role_links"];
    }>("/admin/me");
    if (!admin.success || !admin.data?.id) {
      return site;
    }

    const viewMode: User["view_mode"] =
      admin.data.view_mode === "owner" ||
      admin.data.view_mode === "admin" ||
      admin.data.view_mode === "user"
        ? admin.data.view_mode
        : "admin";

    const mapped: User = {
      id: admin.data.id,
      full_name: admin.data.full_name || "",
      username: admin.data.username || "",
      phone: admin.data.phone || "",
      role: "admin",
      base_role: "admin",
      view_mode: viewMode,
      role_text: admin.data.role_text || "Admin",
      profile_image: admin.data.profile_image || "",
      owner_login_id: admin.data.owner_login_id || "",
      can_switch_owner: Boolean(admin.data.can_switch_owner),
      has_owner_properties: Boolean(admin.data.has_owner_properties),
      is_verified: true,
      is_approved: true,
      role_links: admin.data.role_links || [],
    };

    return {
      success: true,
      status: admin.status,
      data: mapped,
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

  switchMode: (mode: "admin" | "owner") =>
    apiFetch<{
      message: string;
      mode: "admin" | "owner";
      redirect: string;
      user: User;
    }>(
      "/auth/switch-mode",
      { method: "POST", body: JSON.stringify({ mode }) },
      true,
    ),

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

  rateProperty: (
    id: number,
    payload: {
      cleanliness_rating: number;
      location_rating: number;
      comfort_rating: number;
      homeowner_rating: number;
      comment?: string;
    },
  ) =>
    apiFetch<{
      message: string;
      avg_rating: number;
      rating_count: number;
      rating_summary: PropertyRatingSummary;
      user_rating: PropertyUserRating | null;
      reviews: PropertyReview[];
      can_rate: boolean;
      has_confirmed_booking: boolean;
    }>(`/properties/${id}/ratings`, { method: "POST", body: JSON.stringify(payload) }, true),

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

  getRestaurant: (idOrSlug: number | string) =>
    apiFetch<Restaurant>(`/restaurants/${encodeURIComponent(String(idOrSlug))}`),

  getPlaces: (filters: Record<string, string | undefined> = {}) =>
    apiFetch<PlaceListResult>(`/places${toQuery(filters, "")}`),

  getPlace: (idOrSlug: number | string) =>
    apiFetch<Place>(`/places/${encodeURIComponent(String(idOrSlug))}`),

  getDeliveryHouses: (filters: Record<string, string | undefined> = {}) =>
    apiFetch<DeliveryHouseListResult>(`/delivery/houses${toQuery(filters, "")}`),

  getDeliveryHouse: (id: number) =>
    apiFetch<DeliveryHouse>(`/delivery/houses/${id}`),

  createDeliveryOrder: (payload: {
    house_id: number;
    guest_name: string;
    guest_phone: string;
    note?: string;
    payment_method?: "cash" | "card_on_delivery";
    items: Array<{ product_id: number; quantity: number }>;
  }) =>
    apiFetch<DeliveryOrderResult>(
      "/delivery/orders",
      { method: "POST", body: JSON.stringify(payload) },
      true,
    ),

  trackDeliveryOrder: (token: string) =>
    apiFetch<DeliveryTrackedOrder>(
      `/delivery/orders/track/${encodeURIComponent(token)}`,
    ),

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
        favorite_count: number;
        avg_rating?: number;
        rating_count?: number;
        rating_summary?: {
          avg_rating: number;
          rating_count: number;
          cleanliness_avg: number;
          location_avg: number;
          comfort_avg: number;
          homeowner_avg: number;
        };
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
        cover_path: string;
        cover_url: string;
        cover_image: OwnerPropertyImage | null;
        images: OwnerPropertyImage[];
        blocked_dates: string[];
        occupied_ranges: Array<{
          check_in: string;
          check_out: string;
          source?: string;
        }>;
        avg_rating?: number;
        rating_count?: number;
        rating_summary?: PropertyRatingSummary;
        reviews?: PropertyReview[];
        favorite_count?: number;
      };
      tags: string[];
    }>(`/owner/properties/${id}`),

  updateOwnerProperty: (id: number, payload: Record<string, unknown>) =>
    apiFetch<{ message: string; id: number; property_id: number }>(
      `/owner/properties/${id}`,
      { method: "PUT", body: JSON.stringify(payload) },
      true,
    ),

  patchOwnerProperty: (id: number, payload: { is_active?: boolean; is_featured?: boolean }) =>
    apiFetch<{
      message: string;
      id: number;
      property_id: number;
      is_active?: boolean;
      is_featured?: boolean;
    }>(`/owner/properties/${id}`, { method: "PATCH", body: JSON.stringify(payload) }, true),

  getOwnerWallet: () =>
    apiFetch<{
      balance: number;
      packages: Array<{ key: string; label: string; days: number; price: number }>;
      payment_accounts: Array<{
        account_title: string;
        bank_name: string;
        card_holder: string;
        card_number_masked: string;
        card_number: string;
        phone: string;
        whatsapp: string;
      }>;
      topup_hint: string;
      admin_whatsapp: string;
    }>("/owner/wallet"),

  buyOwnerPremium: (propertyId: number, packageKey: string) =>
    apiFetch<{
      message: string;
      balance: number;
      property_id: number;
      is_featured: boolean;
      days: number;
      price: number;
    }>(
      `/owner/properties/${propertyId}/premium`,
      { method: "POST", body: JSON.stringify({ package: packageKey }) },
      true,
    ),

  trackSiteVisit: () => apiFetch<{ total: number; today: number; date: string }>("/analytics/visit", { method: "POST" }),

  getMyRatings: () =>
    apiFetch<{
      items: Array<{
        property_id: number;
        title: string;
        location: string;
        price: number;
        cover_url: string;
        rating: number;
        cleanliness_rating: number;
        location_rating: number;
        comfort_rating: number;
        homeowner_rating: number;
        comment: string;
        created_at: string;
        updated_at: string;
      }>;
      total: number;
    }>("/auth/ratings"),

  saveOwnerBlockedDates: (id: number, dates: string[]) =>
    apiFetch<{ message: string; items: string[]; total: number }>(
      `/owner/properties/${id}/blocked-dates`,
      { method: "PUT", body: JSON.stringify({ dates }) },
      true,
    ),

  uploadOwnerPropertyCover: (id: number, file: File) =>
    uploadCompressedFile<{
      message: string;
      property_id: number;
      cover_image: OwnerPropertyImage;
      images: OwnerPropertyImage[];
      cover_url: string;
      cover_path: string;
    }>(`/owner/properties/${id}/cover-image`, "cover", file),

  uploadOwnerPropertyImages: async (id: number, files: FileList | File[]) => {
    type UploadResult = {
      message: string;
      uploaded: Array<{ id: number; url: string; path: string }>;
      property_id: number;
      images: OwnerPropertyImage[];
      cover_image: OwnerPropertyImage | null;
      cover_url: string;
      cover_path?: string;
    };

    const list = Array.from(files);
    if (list.length === 0) {
      return { success: false as const, error: "Şəkil seçilməyib" };
    }

    const allUploaded: UploadResult["uploaded"] = [];
    let last: ApiResponse<UploadResult> | null = null;

    for (const file of list) {
      const prepared = await compressImageForUpload(file);
      let formData = new FormData();
      formData.append("images[]", prepared);
      let res = await postMultipart<UploadResult>(`/owner/properties/${id}/images`, formData);

      if (res.status === 413 || (!res.success && /413|böyük|too large/i.test(res.error || ""))) {
        const smaller = await compressImageAggressive(prepared);
        formData = new FormData();
        formData.append("images[]", smaller);
        res = await postMultipart<UploadResult>(`/owner/properties/${id}/images`, formData);
      }

      if (!res.success || !res.data) {
        return {
          success: false as const,
          error:
            res.error ||
            httpStatusMessage(res.status || 413) ||
            `${file.name} yüklənmədi`,
          status: res.status,
        };
      }

      allUploaded.push(...(res.data.uploaded || []));
      last = res;
    }

    if (!last?.data) {
      return { success: false as const, error: "Şəkillər yüklənmədi" };
    }

    return {
      success: true as const,
      data: {
        ...last.data,
        uploaded: allUploaded,
        message: `${allUploaded.length} şəkil uğurla yükləndi`,
      },
    };
  },

  deleteOwnerPropertyImage: (propertyId: number, imageId: number) =>
    apiFetch<{
      message: string;
      images: OwnerPropertyImage[];
      cover_image: OwnerPropertyImage | null;
      cover_url: string;
      cover_path: string;
    }>(
      `/owner/properties/${propertyId}/images/${imageId}`,
      { method: "DELETE", body: "{}" },
      true,
    ),

  setOwnerPropertyCover: (propertyId: number, imageId: number) =>
    apiFetch<{
      message: string;
      cover_url: string;
      cover_path: string;
      cover_image: OwnerPropertyImage;
      images: OwnerPropertyImage[];
    }>(
      `/owner/properties/${propertyId}/cover`,
      { method: "POST", body: JSON.stringify({ image_id: imageId }) },
      true,
    ),

  reorderOwnerPropertyImages: (propertyId: number, imageIds: number[]) =>
    apiFetch<{
      message: string;
      property_id: number;
      images: OwnerPropertyImage[];
      cover_image: OwnerPropertyImage | null;
    }>(
      `/owner/properties/${propertyId}/images/order`,
      { method: "PUT", body: JSON.stringify({ image_ids: imageIds }) },
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
    apiFetch<ConversationPayload>(`/chat/conversations/${conversationId}`),

  sendChatMessage: (conversationId: number, message: string) =>
    apiFetch<{
      message: string;
      message_id: number;
      conversation: ConversationPayload;
    }>(
      `/chat/conversations/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ message }) },
      true,
    ),

  deleteChatMessage: (conversationId: number, messageId: number) =>
    apiFetch<{
      message: string;
      conversation: ConversationPayload;
    }>(
      `/chat/conversations/${conversationId}/messages/${messageId}/delete`,
      { method: "POST", body: JSON.stringify({ message_id: messageId }) },
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
        conversation_id?: number;
        status: string;
        payment_status: string;
        check_in: string;
        check_out: string;
        guest_name: string;
        guest_phone: string;
        guest_count: number;
        note: string;
        created_at: string;
        contact_unlocked?: boolean;
        can_confirm?: boolean;
        can_cancel?: boolean;
        confirm_blocked_reason?: string;
      }>;
      total: number;
    }>("/owner/bookings"),

  ownerBookingAction: (bookingId: number, action: "confirm" | "cancel") =>
    apiFetch<{
      message: string;
      booking: {
        id: number;
        property_id: number;
        property_title: string;
        conversation_id?: number;
        status: string;
        payment_status: string;
        check_in: string;
        check_out: string;
        guest_name: string;
        guest_phone: string;
        guest_count: number;
        note: string;
        created_at: string;
        contact_unlocked?: boolean;
        can_confirm?: boolean;
        can_cancel?: boolean;
        confirm_blocked_reason?: string;
      } | null;
    }>(
      `/owner/bookings/${bookingId}/action`,
      { method: "POST", body: JSON.stringify({ action }) },
      true,
    ),

  getOwnerRatings: () =>
    apiFetch<{
      items: Array<{
        rating: number;
        comment: string;
        created_at: string;
        full_name: string;
        username: string;
        property_id?: number;
        property_title?: string;
        source?: string;
      }>;
      total: number;
      avg_rating: number;
      rating_count: number;
    }>("/owner/ratings"),

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

type ConversationPayload = {
  id: number;
  property_id: number;
  property_title: string;
  guest_name: string;
  owner_name: string;
  messages: ChatMessage[];
  total_messages: number;
  contact_unlocked?: boolean;
  peer_name?: string;
  peer_phone?: string;
  phone_locked_message?: string;
  both_sides_chatted?: boolean;
  viewer_is_owner?: boolean;
  booking?: {
    id: number;
    status: string;
    payment_status: string;
    check_in: string;
    check_out: string;
    guest_count: number;
    guest_name: string;
    can_confirm: boolean;
    can_cancel: boolean;
    confirm_blocked_reason: string;
  } | null;
};
