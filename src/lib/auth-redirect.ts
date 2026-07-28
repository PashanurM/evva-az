const POST_LOGOUT_KEY = "evva_post_logout";
const ADMIN_OWNER_MODE_KEY = "evva_admin_owner_mode";

export function markAdminOwnerMode(active: boolean): void {
  try {
    if (active) sessionStorage.setItem(ADMIN_OWNER_MODE_KEY, "1");
    else sessionStorage.removeItem(ADMIN_OWNER_MODE_KEY);
  } catch {
    // ignore
  }
}

export function isAdminOwnerModeMarked(): boolean {
  try {
    return sessionStorage.getItem(ADMIN_OWNER_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberPostLogoutRedirect(path: string): void {
  try {
    sessionStorage.setItem(POST_LOGOUT_KEY, path);
  } catch {
    // ignore
  }
}

export function consumePostLogoutRedirect(fallback: string): string {
  try {
    const stored = sessionStorage.getItem(POST_LOGOUT_KEY);
    if (stored) {
      sessionStorage.removeItem(POST_LOGOUT_KEY);
      return stored;
    }
  } catch {
    // ignore
  }
  return fallback;
}

export function resolveAdminOwnerLogoutPath(user: {
  can_switch_owner?: boolean;
  base_role?: string;
  view_mode?: string;
  role?: string;
} | null | undefined): string {
  const isAdminAccount =
    Boolean(user?.can_switch_owner) ||
    user?.base_role === "admin" ||
    isAdminOwnerModeMarked();

  return isAdminAccount ? "/admin/login" : "/login";
}

/** Prefer deep-link return URL; otherwise send owners/admins to their panel. */
export function resolvePostLoginPath(
  user: { role?: string; base_role?: string } | null | undefined,
  returnUrl?: string | null,
): string {
  const next = (returnUrl || "").trim();
  const safeNext =
    next.startsWith("/") && !next.startsWith("//") && next !== "/" ? next : "";

  if (safeNext) return safeNext;

  const role = user?.role || user?.base_role || "";
  if (role === "owner") return "/my-houses";
  if (role === "admin") return "/admin";
  return "/";
}
