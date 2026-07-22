import { getApiBackendBase } from "@/lib/api-base";
import { backendFetch, forwardBackendHeaders } from "@/lib/backend-fetch";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

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
        // Preserve binary multipart body + boundary for PHP $_FILES
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
