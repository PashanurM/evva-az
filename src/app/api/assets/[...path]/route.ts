import { getApiBackendBase } from "@/lib/api-base";
import { backendFetch } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxyAsset(request: Request, context: RouteContext) {
  try {
    const { path } = await context.params;
    const pathname = path.map(encodeURIComponent).join("/");

    if (
      path.length === 0 ||
      !["uploads", "assets"].includes(path[0]) ||
      path.some((part) => part === "." || part === "..")
    ) {
      return Response.json({ error: "Invalid asset path" }, { status: 400 });
    }

    const target = `${getApiBackendBase()}/${pathname}`;
    const upstream = await backendFetch(target, {
      method: request.method,
      headers: { accept: request.headers.get("accept") || "*/*" },
    });

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

    return new Response(
      request.method === "HEAD" ? null : await upstream.arrayBuffer(),
      { status: upstream.status, headers },
    );
  } catch {
    return Response.json({ error: "Asset unavailable" }, { status: 502 });
  }
}

export async function GET(request: Request, context: RouteContext) {
  return proxyAsset(request, context);
}

export async function HEAD(request: Request, context: RouteContext) {
  return proxyAsset(request, context);
}
