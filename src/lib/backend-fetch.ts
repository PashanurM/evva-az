import https from "node:https";
import { URL } from "node:url";
import { getApiBackendBase } from "./api-base";

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

    req.on("error", reject);
    if (body && method !== "GET" && method !== "HEAD") {
      req.write(body);
    }
    req.end();
  });
}

/** Server-side fetch to the PHP backend (Next route handler + SSR). */
export async function backendFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBackendBase();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const options: RequestInit = { ...init, cache: "no-store" };

  if (url.startsWith("https://") && process.env.NODE_ENV === "development") {
    return nodeHttpsFetch(url, options);
  }

  return fetch(url, options);
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
  if (setCookies.length > 0) {
    setCookies.forEach((cookie) => headers.append("set-cookie", cookie));
  } else {
    const single = source.get("set-cookie");
    if (single) headers.append("set-cookie", single);
  }

  return headers;
}
