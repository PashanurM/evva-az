# EVVA Next.js Frontend

Modern frontend for EVVA.AZ, consuming the PHP API at `/api/v1`.

API requests to `https://evva.az/api/v1/*` are proxied by `src/app/api/v1/[...path]/route.ts` to the PHP backend on Alwaysdata.

## Setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Client API base (default `/api/v1`) |
| `API_PROXY_URL` | PHP backend for Next.js rewrites (build-time on Vercel) |
| `INTERNAL_API_URL` | Server-side fetch URL in `server-api.ts` |

**Local dev:** `API_PROXY_URL=http://localhost/evva`

**Vercel production:** set in Project → Settings → Environment Variables:

```
API_PROXY_URL=https://pashanur.alwaysdata.net
INTERNAL_API_URL=https://pashanur.alwaysdata.net
```

If unset on Vercel, the app defaults to `https://pashanur.alwaysdata.net` automatically.

**Note:** `/restaurants` loads data on the **server** (SSR). You will not see `/api/v1/restaurants` in the browser Network tab — test instead:

```
https://evva.az/api/v1/restaurants
https://pashanur.alwaysdata.net/api/v1/restaurants
```

## Structure

```
frontend/
  src/
    app/              # Next.js App Router pages
    components/       # UI components (Header, PropertyCard, SearchForm)
    lib/              # API client + types + server fetch helpers
    providers/        # Auth context
  public/
    css/              # Legacy EVVA stylesheets (copied from root css/)
    assets/           # Static assets
```

## Pages (Phase 1)

- `/` — Homepage with search + property grid
- `/property/[id]` — Property detail
- `/login` — Login
- `/register` — Registration

Legacy PHP pages (booking, chat, admin, owner) still link to old URLs until migrated.

## Production

Deploy Next.js separately or alongside PHP. Ensure:
1. `/api/v1/*` routes to `backend/public/index.php`
2. CORS / cookies work on same domain (`evva.az`)
3. Set `EVVA_CORS_ORIGINS` on PHP backend
