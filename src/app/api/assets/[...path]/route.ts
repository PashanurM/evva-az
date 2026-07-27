import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { getApiBackendBase } from "@/lib/api-base";
import { backendFetch } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const REMOTE_ASSET_BASE = (
  process.env.ASSET_FALLBACK_URL ||
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  "https://pashanur.alwaysdata.net"
).replace(/\/+$/, "");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
};

function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || "application/octet-stream";
}

function localCandidates(pathname: string): string[] {
  const root = process.cwd();
  // frontend/ cwd → repo root is parent
  const repoRoot = path.resolve(root, "..");
  const normalized = pathname.replaceAll("/", path.sep);

  return [
    path.join(repoRoot, "backend", normalized),
    path.join(repoRoot, "backend", "public", normalized),
    path.join(repoRoot, normalized),
    path.join(root, "public", normalized),
  ];
}

function tryLocalFile(pathname: string, method: string): Response | null {
  for (const candidate of localCandidates(pathname)) {
    try {
      if (!existsSync(candidate) || !statSync(candidate).isFile()) continue;
      const headers = new Headers({
        "content-type": contentTypeFor(candidate),
        "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      });
      if (method === "HEAD") {
        headers.set("content-length", String(statSync(candidate).size));
        return new Response(null, { status: 200, headers });
      }
      const body = readFileSync(candidate);
      headers.set("content-length", String(body.byteLength));
      return new Response(body, { status: 200, headers });
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function fetchUpstream(url: string, method: string, accept: string): Promise<Response | null> {
  try {
    const upstream = await backendFetch(url, {
      method,
      headers: { accept },
    });
    if (!upstream.ok) return null;

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    const contentLength = upstream.headers.get("content-length");
    const etag = upstream.headers.get("etag");
    const lastModified = upstream.headers.get("last-modified");

    if (contentType) headers.set("content-type", contentType);
    if (contentLength) headers.set("content-length", contentLength);
    if (etag) headers.set("etag", etag);
    if (lastModified) headers.set("last-modified", lastModified);
    headers.set("cache-control", "public, max-age=3600, stale-while-revalidate=86400");

    return new Response(method === "HEAD" ? null : await upstream.arrayBuffer(), {
      status: upstream.status,
      headers,
    });
  } catch {
    return null;
  }
}

async function proxyAsset(request: Request, context: RouteContext) {
  const { path: parts } = await context.params;
  const pathname = parts.map(encodeURIComponent).join("/");

  if (
    parts.length === 0 ||
    !["uploads", "assets"].includes(parts[0]) ||
    parts.some((part) => part === "." || part === "..")
  ) {
    return Response.json({ error: "Invalid asset path" }, { status: 400 });
  }

  const decodedPath = parts.join("/");
  const method = request.method;
  const accept = request.headers.get("accept") || "*/*";

  // 1) Local disk (XAMPP upload folder) when present
  const local = tryLocalFile(decodedPath, method);
  if (local) return local;

  const primaryBase = getApiBackendBase();
  const targets = [`${primaryBase}/${pathname}`];

  // 2) Remote Alwaysdata fallback — images live there when local Apache is down
  //    or uploads were never synced to this machine.
  if (REMOTE_ASSET_BASE && REMOTE_ASSET_BASE !== primaryBase) {
    targets.push(`${REMOTE_ASSET_BASE}/${pathname}`);
  }

  for (const target of targets) {
    const response = await fetchUpstream(target, method, accept);
    if (response) return response;
  }

  return Response.json({ error: "Asset unavailable" }, { status: 502 });
}

export async function GET(request: Request, context: RouteContext) {
  return proxyAsset(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return proxyAsset(request, context);
}
