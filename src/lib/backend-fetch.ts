import https from "node:https";
import { URL } from "node:url";
import { getApiBackendBase, getApiBackendFallbackBase } from "./api-base";

type BackendFetchInit = RequestInit & {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

const insecureHttpsAgent =
  process.env.NODE_ENV === "development"
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

function headersToObject(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    const out: Record<string, string> = {};
    headers.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return { ...headers };
}

function bodyToBuffer(body: BodyInit | null | undefined): Buffer | string | undefined {
  if (body == null) return undefined;
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof ArrayBuffer) return Buffer.from(body);
  if (ArrayBuffer.isView(body)) {
    return Buffer.from(body.buffer, body.byteOffset, body.byteLength);
  }
  return undefined;
}

function nodeHttpsFetch(url: string, init: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const method = init.method || "GET";
    const headers = headersToObject(init.headers);
    const body = bodyToBuffer(init.body as BodyInit | null | undefined);

    if (body && !headers["content-length"] && !headers["Content-Length"]) {
      headers["content-length"] = String(Buffer.byteLength(body));
    }

    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method,
        headers,
        agent: insecureHttpsAgent,
        timeout: 25_000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => {
          const responseHeaders = new Headers();
          Object.entries(res.headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((entry) => responseHeaders.append(key, entry));
            } else if (value !== undefined) {
              responseHeaders.set(key, value);
            }
          });

          resolve(
            new Response(Buffer.concat(chunks), {
              status: res.statusCode || 500,
              statusText: res.statusMessage,
              headers: responseHeaders,
            }),
          );
        });
      },
    );

    req.on("timeout", () => {
      req.destroy(new Error("Upstream request timed out"));
    });
    req.on("error", reject);
    if (body && method !== "GET" && method !== "HEAD") {
      req.write(body);
    }
    req.end();
  });
}

async function rawBackendFetch(url: string, options: BackendFetchInit): Promise<Response> {
  if (url.startsWith("https://") && process.env.NODE_ENV === "development") {
    return nodeHttpsFetch(url, options);
  }

  const controller = new AbortController();
  // Alwaysdata PHP can be cold / run schema checks on first hit.
  // 4s was too aggressive → AbortError → proxy 502 "Backend API unreachable".
  const timeoutMs = Number(process.env.EVVA_BACKEND_TIMEOUT_MS || 20000);
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: options.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function swapBackendHost(url: string, fromBase: string, toBase: string): string {
  if (url.startsWith(fromBase)) {
    return `${toBase}${url.slice(fromBase.length)}`;
  }
  try {
    const parsed = new URL(url);
    const from = new URL(fromBase);
    if (parsed.host === from.host) {
      return `${toBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // ignore
  }
  return url;
}

function isRetryableUpstreamError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { name?: string; code?: string; cause?: { code?: string } };
  if (anyErr.name === "AbortError" || anyErr.name === "TimeoutError") return true;
  const code = anyErr.code || anyErr.cause?.code || "";
  return ["ECONNREFUSED", "ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "UND_ERR_CONNECT_TIMEOUT"].includes(
    code,
  );
}

/** Server-side fetch to the PHP backend (Next route handler + SSR). */
export async function backendFetch(
  path: string,
  init: BackendFetchInit = {},
): Promise<Response> {
  const base = getApiBackendBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  // Default uncached (auth/proxy-safe). Callers can opt into ISR via next.revalidate.
  const options: BackendFetchInit = {
    ...init,
    cache: init.cache ?? (init.next?.revalidate != null ? undefined : "no-store"),
  };

  if (init.next?.revalidate != null && options.cache === undefined) {
    delete options.cache;
  }

  try {
    return await rawBackendFetch(url, options);
  } catch (err) {
    const fallback = getApiBackendFallbackBase();
    if (!fallback || !isRetryableUpstreamError(err)) {
      throw err;
    }
    const retryUrl = swapBackendHost(url, base, fallback);
    if (retryUrl === url) throw err;
    return rawBackendFetch(retryUrl, options);
  }
}

/** Copy response headers from PHP backend to the Next.js proxy response. */
export function forwardBackendHeaders(source: Headers): Headers {
  const headers = new Headers();
  const passthrough = [
    "content-type",
    "cache-control",
    "etag",
    "last-modified",
    "x-ratelimit-limit",
    "x-ratelimit-remaining",
  ];

  source.forEach((value, key) => {
    if (passthrough.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  const setCookies =
    typeof source.getSetCookie === "function" ? source.getSetCookie() : [];
  const cookies =
    setCookies.length > 0
      ? setCookies
      : source.get("set-cookie")
        ? [source.get("set-cookie") as string]
        : [];

  for (const cookie of cookies) {
    headers.append("set-cookie", rewriteCookieForLocalProxy(cookie));
  }

  return headers;
}

/**
 * Alwaysdata sets Secure session cookies. Next.js on http://localhost cannot
 * store Secure cookies, so strip Secure/Domain in development.
 */
function rewriteCookieForLocalProxy(cookie: string): string {
  if (process.env.NODE_ENV === "production") return cookie;

  return cookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      const lower = part.toLowerCase();
      if (lower === "secure") return false;
      if (lower.startsWith("domain=")) return false;
      return part.length > 0;
    })
    .join("; ");
}
