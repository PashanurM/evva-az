import type { ApiResponse } from "./types";
import {
  compressImageAggressive,
  compressImageForUpload,
  httpStatusMessage,
} from "./image-compress";

/** Same proxy as public site by default; override with NEXT_PUBLIC_ADMIN_API_URL if needed. */
const API_BASE = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_API_URL || "/api/v1";

const JSON_TIMEOUT_MS = 45_000;
const UPLOAD_TIMEOUT_MS = 90_000;

let csrfTokenCache: string | null = null;

async function parseJson<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    const data = (await res.json()) as ApiResponse<T>;
    if (!res.ok && !data.error) {
      data.error = httpStatusMessage(res.status);
      data.success = false;
    }
    data.status = res.status;
    return data;
  } catch {
    return {
      success: false,
      error: res.ok ? "Invalid API response" : httpStatusMessage(res.status),
      status: res.status,
    };
  }
}

function mergeAbortSignals(userSignal: AbortSignal | null | undefined, timeoutMs: number): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onUserAbort = () => controller.abort();
  if (userSignal) {
    if (userSignal.aborted) controller.abort();
    else userSignal.addEventListener("abort", onUserAbort, { once: true });
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      userSignal?.removeEventListener("abort", onUserAbort);
    },
  };
}

function networkErrorMessage(err: unknown): string {
  if (err instanceof DOMException && err.name === "AbortError") {
    return "Sorğu vaxtı bitdi. Yenidən cəhd edin.";
  }
  return "Şəbəkə xətası. Yenidən cəhd edin.";
}

async function ensureCsrf(force = false): Promise<void> {
  if (csrfTokenCache && !force) return;
  const { signal, clear } = mergeAbortSignals(undefined, 15_000);
  try {
    const csrfRes = await fetch(`${API_BASE}/auth/csrf`, {
      credentials: "include",
      cache: "no-store",
      signal,
    });
    const csrfData = await parseJson<{ csrf_token: string }>(csrfRes);
    csrfTokenCache = csrfData.data?.csrf_token || null;
  } finally {
    clear();
  }
}

async function postMultipart<T>(
  path: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  await ensureCsrf();
  const headers = new Headers();
  if (csrfTokenCache) headers.set("X-CSRF-TOKEN", csrfTokenCache);
  const { signal, clear } = mergeAbortSignals(undefined, UPLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers,
      signal,
    });
    if (res.status === 403) {
      csrfTokenCache = null;
      await ensureCsrf(true);
      if (csrfTokenCache) {
        const retryHeaders = new Headers();
        retryHeaders.set("X-CSRF-TOKEN", csrfTokenCache);
        const { signal: retrySignal, clear: clearRetry } = mergeAbortSignals(undefined, UPLOAD_TIMEOUT_MS);
        try {
          const retryRes = await fetch(`${API_BASE}${path}`, {
            method: "POST",
            body: formData,
            credentials: "include",
            headers: retryHeaders,
            signal: retrySignal,
          });
          return parseJson<T>(retryRes);
        } finally {
          clearRetry();
        }
      }
    }
    return parseJson<T>(res);
  } catch (err) {
    return { success: false, error: networkErrorMessage(err) };
  } finally {
    clear();
  }
}

/**
 * Compress image, upload once; on HTTP 413 retry with stronger compression.
 */
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

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
  needsCsrf = false,
): Promise<ApiResponse<T>> {
  const run = async (forceCsrf: boolean): Promise<ApiResponse<T>> => {
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    if (needsCsrf) {
      await ensureCsrf(forceCsrf);
      if (csrfTokenCache) {
        headers.set("X-CSRF-TOKEN", csrfTokenCache);
      }
    }

    const { signal, clear } = mergeAbortSignals(
      options.signal ?? undefined,
      JSON_TIMEOUT_MS,
    );
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        credentials: "include",
        cache: "no-store",
        signal,
      });

      if (needsCsrf && res.status === 403) {
        csrfTokenCache = null;
      }

      return parseJson<T>(res);
    } finally {
      clear();
    }
  };

  try {
    let result = await run(false);
    // Stale CSRF can block create/update — refresh once and retry.
    if (needsCsrf && result.status === 403) {
      result = await run(true);
    }
    return result;
  } catch (err) {
    return { success: false, error: networkErrorMessage(err) };
  }
}

export interface AdminUser {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  role: "admin";
  role_text: string;
  profile_image: string;
  owner_login_id: string;
}

export interface AdminDashboard {
  properties: number;
  inactive_properties: number;
  users: number;
  pending_users: number;
  owners: number;
  bookings: number;
  pending_bookings: number;
  payment_pending_bookings: number;
  restaurants: number;
  places: number;
  favorites: number;
  modules: {
    restaurants: boolean;
    places: boolean;
    delivery: boolean;
  };
}

export interface AdminProperty {
  id: number;
  title: string;
  location: string;
  price: number;
  capacity: number;
  rooms: number;
  views: number;
  cover_url: string;
  is_active: boolean;
  is_featured: boolean;
  owner_user_id: number;
  owner_name: string;
  owner_username?: string;
  avg_rating: number;
  rating_count: number;
}

export interface AdminPropertyFormMeta {
  owners: Array<{
    id: number;
    full_name: string;
    username: string;
    phone: string;
    owner_login_id: string;
    role: string;
  }>;
  tags: string[];
  primary_owner_id: number;
}

export interface AdminPropertyImage {
  id: number;
  url: string;
  image_path: string;
  is_cover: boolean;
}

export interface AdminPropertyDetail {
  id: number;
  title: string;
  location: string;
  price: number;
  capacity: number;
  rooms: number;
  description: string;
  latitude: string | null;
  longitude: string | null;
  map_address: string;
  single_beds: number;
  double_beds: number;
  sofa_beds: number;
  bathrooms: number;
  minimum_nights: number;
  check_in_time: string;
  check_out_time: string;
  is_active: boolean;
  is_featured: boolean;
  children_allowed: number | boolean;
  pets_allowed: number | boolean;
  heated_pool: number | boolean;
  wifi: number | boolean;
  parking: number | boolean;
  barbecue: number | boolean;
  air_conditioner: number | boolean;
  heating: number | boolean;
  kitchen: number | boolean;
  washing_machine: number | boolean;
  house_rules: string;
  cancellation_policy: string;
  tags_list: string[];
  owner_user_id: number;
  cover_url: string;
  cover_path?: string;
  cover_image: AdminPropertyImage | null;
  images: AdminPropertyImage[];
}

export type AdminPropertyPayload = Record<string, unknown>;

export interface AdminUserRow {
  id: number;
  full_name: string;
  username: string;
  phone: string;
  role: string;
  is_verified: boolean;
  is_approved: boolean;
  wallet_balance: number;
  owner_login_id: string;
  property_count: number;
  created_at: string;
}

export interface AdminRegistrationRequest {
  id: number;
  full_name: string;
  phone: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface AdminBooking {
  id: number;
  status: string;
  payment_status: string;
  check_in: string;
  check_out: string;
  guest_phone: string;
  platform_fee_total: number;
  created_at: string;
  contact_unlocked_at: string | null;
  property_id: number;
  property_title: string;
  property_location: string;
  guest_user_id: number | null;
  guest_name: string | null;
  owner_user_id: number | null;
  owner_name: string | null;
  owner_phone: string | null;
}

export interface AdminPaymentAccount {
  id: number;
  account_title: string;
  bank_name: string;
  card_holder: string;
  card_number: string;
  card_number_masked: string;
  phone: string;
  whatsapp: string;
  color_theme: string;
  is_active: boolean;
  sort_order: number;
}

export interface AdminRestaurant {
  id: number;
  name: string;
  slug: string;
  location: string;
  is_active: boolean;
  is_featured: boolean;
  menu_count: number;
  manager_names: string | null;
}

export interface AdminPlace {
  id: number;
  title: string;
  slug: string;
  category: string;
  location: string;
  cover_url: string;
  entry_price: number;
  is_featured: boolean;
  is_active: boolean;
  avg_rating: number;
  rating_count: number;
}

export interface AdminChatConversation {
  id: number;
  property_id: number;
  updated_at: string;
  property_title: string | null;
  guest_name: string | null;
  guest_phone: string | null;
  owner_name: string | null;
  last_message: string | null;
}

export type AdminDetailResource =
  | "properties"
  | "reservations"
  | "restaurants"
  | "places"
  | "payments"
  | "users"
  | "messages";

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  getMe: () => adminFetch<AdminUser>("/admin/me"),
  getDashboard: () => adminFetch<AdminDashboard>("/admin/dashboard"),

  loginWithPin: (pin: string) => {
    csrfTokenCache = null;
    return adminFetch<AdminUser>(
      "/admin/login",
      { method: "POST", body: JSON.stringify({ login_mode: "pin", pin }) },
      true,
    );
  },

  loginWithPassword: (username: string, password: string) => {
    csrfTokenCache = null;
    return adminFetch<AdminUser>(
      "/admin/login",
      {
        method: "POST",
        body: JSON.stringify({ login_mode: "password", username, password }),
      },
      true,
    );
  },

  logout: () => {
    csrfTokenCache = null;
    return adminFetch<{ message: string }>(
      "/admin/logout",
      { method: "POST", body: "{}" },
      true,
    );
  },

  getProperties: (params: { status?: string; q?: string; sort?: string } = {}) =>
    adminFetch<{ items: AdminProperty[]; total: number; summary: Record<string, number> }>(
      `/admin/properties${qs(params)}`,
    ),

  getPropertyFormMeta: () =>
    adminFetch<AdminPropertyFormMeta>("/admin/properties/form-meta"),

  getProperty: (id: number) =>
    adminFetch<{ property: AdminPropertyDetail }>(`/admin/properties/${id}`),

  createProperty: (body: AdminPropertyPayload) =>
    adminFetch<{
      message: string;
      id: number;
      property_id: number;
      new_owner_credentials?: Record<string, string>;
    }>(
      "/admin/properties",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  updateProperty: (id: number, body: AdminPropertyPayload) =>
    adminFetch<{ message: string; id: number; property_id: number; new_owner_credentials?: Record<string, string> }>(
      `/admin/properties/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),

  uploadPropertyImages: async (id: number, files: FileList | File[]) => {
    type UploadResult = {
      message: string;
      uploaded: Array<{ id: number; url: string; path: string }>;
      property_id: number;
      images: AdminPropertyImage[];
      cover_image: AdminPropertyImage | null;
      cover_url: string;
      cover_path?: string;
    };

    const list = Array.from(files);
    if (list.length === 0) {
      return { success: false, error: "Şəkil seçilməyib" };
    }

    // One file per request — avoids multi-MB combined bodies that trigger HTTP 413.
    const allUploaded: UploadResult["uploaded"] = [];
    let last: ApiResponse<UploadResult> | null = null;

    for (const file of list) {
      const prepared = await compressImageForUpload(file);
      let formData = new FormData();
      formData.append("images[]", prepared);
      let res = await postMultipart<UploadResult>(`/admin/properties/${id}/images`, formData);

      if (res.status === 413 || (!res.success && /413|böyük|too large/i.test(res.error || ""))) {
        const smaller = await compressImageAggressive(prepared);
        formData = new FormData();
        formData.append("images[]", smaller);
        res = await postMultipart<UploadResult>(`/admin/properties/${id}/images`, formData);
      }

      if (!res.success || !res.data) {
        return {
          success: false,
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
      return { success: false, error: "Şəkillər yüklənmədi" };
    }

    return {
      success: true,
      data: {
        ...last.data,
        uploaded: allUploaded,
        message: `${allUploaded.length} şəkil uğurla yükləndi`,
      },
    };
  },

  uploadPropertyCover: (id: number, file: File) =>
    uploadCompressedFile<{
      message: string;
      property_id: number;
      cover_image: AdminPropertyImage;
      images: AdminPropertyImage[];
      cover_url: string;
      cover_path: string;
    }>(`/admin/properties/${id}/cover-image`, "cover", file),

  deletePropertyImage: (propertyId: number, imageId: number) =>
    adminFetch<{
      message: string;
      images: AdminPropertyImage[];
      cover_image: AdminPropertyImage | null;
      cover_url: string;
      cover_path: string;
    }>(
      `/admin/properties/${propertyId}/images/${imageId}`,
      { method: "DELETE", body: "{}" },
      true,
    ),

  setPropertyCover: (propertyId: number, imageId: number) =>
    adminFetch<{
      message: string;
      cover_url: string;
      cover_path: string;
      cover_image: AdminPropertyImage;
      images: AdminPropertyImage[];
    }>(
      `/admin/properties/${propertyId}/cover`,
      { method: "POST", body: JSON.stringify({ image_id: imageId }) },
      true,
    ),

  reorderPropertyImages: (propertyId: number, imageIds: number[]) =>
    adminFetch<{
      message: string;
      property_id: number;
      images: AdminPropertyImage[];
      cover_image: AdminPropertyImage | null;
    }>(
      `/admin/properties/${propertyId}/images/order`,
      { method: "PUT", body: JSON.stringify({ image_ids: imageIds }) },
      true,
    ),

  patchProperty: (id: number, body: { is_active?: boolean; is_featured?: boolean }) =>
    adminFetch<{ message: string }>(
      `/admin/properties/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),

  deleteProperty: (id: number) =>
    adminFetch<{ message: string; id: number; title: string }>(
      `/admin/properties/${id}`,
      { method: "DELETE", body: "{}" },
      true,
    ),

  getUsers: () =>
    adminFetch<{
      pending: AdminUserRow[];
      groups: Record<string, AdminUserRow[]>;
      password_reset_requests: Array<Record<string, unknown>>;
      registration_requests: AdminRegistrationRequest[];
      total: number;
    }>("/admin/users"),

  userAction: (id: number, action: string, extra: Record<string, unknown> = {}) =>
    adminFetch<{ message: string; temp_password?: string }>(
      `/admin/users/${id}/action`,
      { method: "POST", body: JSON.stringify({ action, ...extra }) },
      true,
    ),

  registrationRequestAction: (id: number, action: "approve" | "reject") =>
    adminFetch<{
      message: string;
      temp_password?: string;
      user?: { id: number; full_name: string; phone: string; username: string };
    }>(
      `/admin/registration-requests/${id}/action`,
      { method: "POST", body: JSON.stringify({ action }) },
      true,
    ),

  getBookings: (params: {
    status?: string;
    payment_status?: string;
    from_date?: string;
    to_date?: string;
    q?: string;
  } = {}) =>
    adminFetch<{
      items: AdminBooking[];
      total: number;
      summary: Record<string, number>;
    }>(`/admin/bookings${qs(params)}`),

  bookingAction: (id: number, action: string) =>
    adminFetch<{ message: string }>(
      `/admin/bookings/${id}/action`,
      { method: "POST", body: JSON.stringify({ action }) },
      true,
    ),

  getPaymentAccounts: () =>
    adminFetch<{ items: AdminPaymentAccount[]; total: number }>("/admin/payment-accounts"),

  savePaymentAccount: (body: Record<string, unknown>) =>
    adminFetch<{ message: string; id: number }>(
      "/admin/payment-accounts",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  patchPaymentAccount: (id: number, body: { is_active?: boolean }) =>
    adminFetch<{ message: string }>(
      `/admin/payment-accounts/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),

  deletePaymentAccount: (id: number) =>
    adminFetch<{ message: string }>(
      `/admin/payment-accounts/${id}`,
      { method: "DELETE", body: "{}" },
      true,
    ),

  getRestaurants: () =>
    adminFetch<{ items: AdminRestaurant[]; total: number; module_active: boolean }>(
      "/admin/restaurants",
    ),

  createRestaurant: (body: Record<string, unknown>) =>
    adminFetch<{ message: string; id: number; entity?: Record<string, unknown> }>(
      "/admin/restaurants",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  patchRestaurant: (id: number, body: { is_active?: boolean; is_featured?: boolean }) =>
    adminFetch<{ message: string }>(
      `/admin/restaurants/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
      true,
    ),

  deleteRestaurant: (id: number) =>
    adminFetch<{ message: string; id: number; name: string }>(
      `/admin/restaurants/${id}`,
      { method: "DELETE", body: "{}" },
      true,
    ),

  getPlaces: () =>
    adminFetch<{ items: AdminPlace[]; total: number; module_active: boolean }>("/admin/places"),

  savePlace: (body: Record<string, unknown>) =>
    adminFetch<{ message: string; id: number }>(
      "/admin/places",
      { method: "POST", body: JSON.stringify(body) },
      true,
    ),

  deletePlace: (id: number) =>
    adminFetch<{ message: string }>(
      `/admin/places/${id}`,
      { method: "DELETE", body: "{}" },
      true,
    ),

  patchModule: (key: string, is_active: boolean) =>
    adminFetch<{ message: string }>(
      `/admin/modules/${key}`,
      { method: "PATCH", body: JSON.stringify({ is_active }) },
      true,
    ),

  getChatConversations: () =>
    adminFetch<{ items: AdminChatConversation[]; total: number }>("/admin/chat/conversations"),

  getEntityDetail: (resource: AdminDetailResource, id: number) =>
    adminFetch<{ entity: Record<string, unknown> }>(`/admin/details/${resource}/${id}`),

  updateEntity: (resource: Exclude<AdminDetailResource, "properties">, id: number, body: Record<string, unknown>) =>
    adminFetch<{ message: string; entity: Record<string, unknown> }>(
      `/admin/details/${resource}/${id}`,
      { method: "PUT", body: JSON.stringify(body) },
      true,
    ),

  uploadEntityCover: (resource: "restaurants" | "places", id: number, file: File) =>
    uploadCompressedFile<{ message: string; entity: Record<string, unknown> }>(
      `/admin/details/${resource}/${id}/cover-image`,
      "cover",
      file,
    ),

  uploadEntityImages: async (resource: "restaurants" | "places", id: number, files: File[]) => {
    type EntityUpload = { message: string; entity: Record<string, unknown> };
    if (files.length === 0) {
      return { success: false, error: "Şəkil seçilməyib" };
    }

    let last: ApiResponse<EntityUpload> | null = null;
    for (const file of files) {
      const prepared = await compressImageForUpload(file);
      let formData = new FormData();
      formData.append("images[]", prepared);
      let res = await postMultipart<EntityUpload>(
        `/admin/details/${resource}/${id}/images`,
        formData,
      );

      if (res.status === 413 || (!res.success && /413|böyük|too large/i.test(res.error || ""))) {
        const smaller = await compressImageAggressive(prepared);
        formData = new FormData();
        formData.append("images[]", smaller);
        res = await postMultipart<EntityUpload>(
          `/admin/details/${resource}/${id}/images`,
          formData,
        );
      }

      if (!res.success || !res.data) {
        return {
          success: false,
          error: res.error || httpStatusMessage(res.status || 413),
          status: res.status,
        };
      }
      last = res;
    }

    return last || { success: false, error: "Şəkillər yüklənmədi" };
  },

  deleteEntityImage: (resource: "restaurants" | "places", id: number, imageId: number) =>
    adminFetch<{ message: string; entity: Record<string, unknown> }>(
      `/admin/details/${resource}/${id}/images/${imageId}`,
      { method: "DELETE", body: "{}" },
      true,
    ),
};
