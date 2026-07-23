import { getApiBackendBase } from "@/lib/api-base";
import { backendFetch, forwardBackendHeaders } from "@/lib/backend-fetch";
import { loadGalleryViaPhpCli } from "@/lib/gallery-cli";
import { loadInboxViaPhpCli } from "@/lib/inbox-cli";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

type ImageItem = { path?: string; url?: string };

function isPropertyDetailPath(parts: string[]): number | null {
  if (parts.length !== 2 || parts[0] !== "properties") return null;
  const id = Number(parts[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function isPropertyImagesPath(parts: string[]): number | null {
  if (parts.length !== 3 || parts[0] !== "properties" || parts[2] !== "images") return null;
  const id = Number(parts[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function looksLikeJson(bytes: ArrayBuffer, contentType: string): boolean {
  const head = Buffer.from(bytes).subarray(0, 64).toString("utf8").trimStart();
  const startsJson = head.startsWith("{") || head.startsWith("[");
  // Never trust content-type alone — Alwaysdata fatals can claim JSON while returning HTML.
  if (!startsJson) return false;
  if (contentType.includes("application/json") || contentType.includes("text/json")) return true;
  return startsJson;
}

async function parseJson(bytes: ArrayBuffer): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(Buffer.from(bytes).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchGalleryImages(id: number, headers: Headers): Promise<ImageItem[]> {
  // Dev bridge: read gallery directly from Alwaysdata via local PHP CLI.
  const fromCli = await loadGalleryViaPhpCli(id);
  if (fromCli.length > 0) return fromCli;

  const backend = getApiBackendBase();
  const candidates = [
    `http://localhost/evva/backend/public/property-gallery.php?id=${id}&remote=1`,
    `http://127.0.0.1/evva/backend/public/property-gallery.php?id=${id}&remote=1`,
    `${backend}/api/v1/properties/${id}/images`,
    `${backend}/api/v1/property-gallery.php?id=${id}`,
    `${backend}/backend/public/property-gallery.php?id=${id}`,
    `${backend}/property-gallery.php?id=${id}`,
  ];

  for (const url of candidates) {
    try {
      const res = await backendFetch(url, { method: "GET", headers });
      const type = res.headers.get("content-type") || "";
      const buf = await res.arrayBuffer();
      if (!looksLikeJson(buf, type)) continue;
      const parsed = await parseJson(buf);
      if (!parsed || parsed.success === false) continue;

      const data = parsed.data as Record<string, unknown> | ImageItem[] | undefined;
      const images = Array.isArray(data)
        ? data
        : Array.isArray((data as { images?: ImageItem[] } | undefined)?.images)
          ? ((data as { images: ImageItem[] }).images)
          : [];

      if (images.length > 0) return images;
    } catch {
      // try next candidate
    }
  }

  return [];
}

async function fetchPropertyFromList(id: number, headers: Headers): Promise<Response | null> {
  const backend = getApiBackendBase();
  const listRes = await backendFetch(`${backend}/api/v1/properties`, {
    method: "GET",
    headers,
  });
  const listType = listRes.headers.get("content-type") || "";
  const listBuf = await listRes.arrayBuffer();
  if (!looksLikeJson(listBuf, listType)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(listBuf).toString("utf8")) as {
      success?: boolean;
      data?: { items?: Array<Record<string, unknown>> };
    };
    const item = parsed.data?.items?.find((row) => Number(row.id) === id);
    if (!parsed.success || !item) return null;

    let images =
      Array.isArray(item.images) && (item.images as ImageItem[]).length > 0
        ? (item.images as ImageItem[])
        : [];

    if (images.length <= 1) {
      const gallery = await fetchGalleryImages(id, headers);
      if (gallery.length > images.length) images = gallery;
    }

    if (images.length === 0 && (item.cover_path || item.cover_url)) {
      images = [{ path: String(item.cover_path || ""), url: String(item.cover_url || "") }];
    }

    const detail = {
      ...item,
      occupied_ranges: Array.isArray(item.occupied_ranges) ? item.occupied_ranges : [],
      blocked_dates: Array.isArray(item.blocked_dates) ? item.blocked_dates : [],
      booked_ranges: Array.isArray(item.booked_ranges) ? item.booked_ranges : [],
      images,
    };

    return Response.json(
      { success: true, data: detail },
      {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      },
    );
  } catch {
    return null;
  }
}

async function enrichDetailImages(
  body: ArrayBuffer,
  propertyId: number,
  headers: Headers,
): Promise<ArrayBuffer> {
  const parsed = await parseJson(body);
  if (!parsed?.success || !parsed.data || typeof parsed.data !== "object") return body;

  const data = parsed.data as Record<string, unknown>;
  const current = Array.isArray(data.images) ? (data.images as ImageItem[]) : [];
  if (current.length > 1) return body;

  const gallery = await fetchGalleryImages(propertyId, headers);
  if (gallery.length <= current.length) return body;

  const encoded = new TextEncoder().encode(
    JSON.stringify({
      ...parsed,
      data: {
        ...data,
        images: gallery,
      },
    }),
  );

  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer;
}

async function proxyRequest(request: Request, context: RouteContext) {
  try {
    const { path } = await context.params;
    const backend = getApiBackendBase();
    const pathname = path.join("/");
    const url = new URL(request.url);
    const target = `${backend}/api/v1/${pathname}${url.search}`;

    const headers = new Headers();
    const forwardHeaders = ["accept", "content-type", "cookie", "x-csrf-token", "authorization"];
    forwardHeaders.forEach((name) => {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    });

    if (!headers.has("accept")) {
      headers.set("accept", "application/json");
    }

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      const contentType = (request.headers.get("content-type") || "").toLowerCase();
      const isMultipart = contentType.includes("multipart/form-data");

      if (isMultipart) {
        const bodyBuf = Buffer.from(await request.arrayBuffer());
        init.body = bodyBuf;
        headers.set("content-length", String(bodyBuf.byteLength));
      } else {
        const bodyText = await request.text();
        init.body = bodyText;
        if (bodyText && !headers.has("content-type")) {
          headers.set("content-type", "application/json; charset=utf-8");
        }
        if (bodyText) {
          headers.set("content-length", String(Buffer.byteLength(bodyText)));
        }
      }
    }

    const res = await backendFetch(target, init);
    const body = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "";
    const propertyId =
      request.method === "GET" || request.method === "HEAD"
        ? isPropertyDetailPath(path)
        : null;
    const imagesPropertyId =
      request.method === "GET" || request.method === "HEAD"
        ? isPropertyImagesPath(path)
        : null;

    // Session probe: treat logged-out as a normal 200 so Next DevTools
    // does not flag /auth/me 401 as a runtime "issue".
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      path.length === 2 &&
      path[0] === "auth" &&
      path[1] === "me" &&
      res.status === 401
    ) {
      return Response.json(
        { success: false, data: null, error: "Not authenticated" },
        {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    // Chat inbox: Alwaysdata may return empty items due to broken dbTableExists.
    // Rebuild from remote DB via local PHP CLI when the live API list is empty.
    if (
      (request.method === "GET" || request.method === "HEAD") &&
      path.length === 2 &&
      path[0] === "chat" &&
      path[1] === "conversations" &&
      looksLikeJson(body, contentType)
    ) {
      const parsed = await parseJson(body);
      const data = parsed?.data as { items?: unknown[]; total?: number } | undefined;
      const items = Array.isArray(data?.items) ? data.items : null;
      if (parsed?.success && items && items.length === 0) {
        try {
          const meRes = await backendFetch(`${backend}/api/v1/auth/me`, {
            method: "GET",
            headers,
          });
          const meBuf = await meRes.arrayBuffer();
          const meType = meRes.headers.get("content-type") || "";
          if (looksLikeJson(meBuf, meType)) {
            const meJson = await parseJson(meBuf);
            const meData = meJson?.data as { id?: number } | null;
            const userId = Number(meData?.id || 0);
            if (userId > 0) {
              const fromCli = await loadInboxViaPhpCli(userId);
              if (fromCli.length > 0) {
                return Response.json(
                  { success: true, data: { items: fromCli, total: fromCli.length } },
                  {
                    status: 200,
                    headers: { "content-type": "application/json; charset=utf-8" },
                  },
                );
              }
            }
          }
        } catch {
          // fall through to original empty response
        }
      }
    }

    // Dedicated gallery route: never leak backend 404s to the browser console.
    if (imagesPropertyId) {
      if (looksLikeJson(body, contentType)) {
        const parsed = await parseJson(body);
        const data = parsed?.data as { images?: ImageItem[] } | ImageItem[] | undefined;
        const images = Array.isArray(data)
          ? data
          : Array.isArray(data?.images)
            ? data.images
            : [];
        if (parsed?.success && images.length > 0) {
          return Response.json(
            { success: true, data: { images } },
            {
              status: 200,
              headers: { "content-type": "application/json; charset=utf-8" },
            },
          );
        }
      }

      const gallery = await fetchGalleryImages(imagesPropertyId, headers);
      return Response.json(
        { success: true, data: { images: gallery } },
        {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" },
        },
      );
    }

    // Stale Alwaysdata detail handler can return PHP HTML fatals with HTTP 200.
    if (propertyId && !looksLikeJson(body, contentType)) {
      const fallback = await fetchPropertyFromList(propertyId, headers);
      if (fallback) return fallback;
    }

    // Also recover when backend returns JSON error / empty body for detail.
    if (propertyId && looksLikeJson(body, contentType)) {
      try {
        const parsed = JSON.parse(Buffer.from(body).toString("utf8")) as {
          success?: boolean;
          data?: unknown;
        };
        if (!parsed.success || !parsed.data) {
          const fallback = await fetchPropertyFromList(propertyId, headers);
          if (fallback) return fallback;
        } else {
          const enriched = await enrichDetailImages(body, propertyId, headers);
          return new Response(enriched, {
            status: 200,
            headers: {
              "content-type": "application/json; charset=utf-8",
            },
          });
        }
      } catch {
        const fallback = await fetchPropertyFromList(propertyId, headers);
        if (fallback) return fallback;
      }
    }

    // Last resort for detail: rebuild from list + CLI gallery.
    if (propertyId) {
      const fallback = await fetchPropertyFromList(propertyId, headers);
      if (fallback) return fallback;
    }

    return new Response(body, {
      status: res.status,
      headers: forwardBackendHeaders(res.headers),
    });
  } catch {
    return Response.json(
      { success: false, error: "Backend API unreachable" },
      { status: 502 },
    );
  }
}

export async function GET(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return proxyRequest(request, context);
}
