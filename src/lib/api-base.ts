/**
 * PHP backend root URL for server-side fetches and Next.js rewrites.
 * Local dev defaults to XAMPP (http://localhost/evva) when env vars are unset.
 * Override with API_PROXY_URL / INTERNAL_API_URL for remote staging/production.
 */
export function getApiBackendBase(): string {
  const fromEnv =
    process.env.INTERNAL_API_URL ||
    process.env.API_PROXY_URL ||
    "";

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (process.env.NODE_ENV === "development") {
    return "http://localhost/evva";
  }

  return "https://pashanur.alwaysdata.net";
}

/**
 * Admin panel API backend.
 * Prefer ADMIN_API_URL; otherwise same as public API (Alwaysdata / production).
 * Set ADMIN_API_URL=http://localhost/evva only when testing against local XAMPP DB.
 */
export function getAdminApiBackendBase(): string {
  const fromEnv = process.env.ADMIN_API_URL || "";
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return getApiBackendBase();
}
