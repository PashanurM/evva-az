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
