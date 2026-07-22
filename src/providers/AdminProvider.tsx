"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { adminApi, type AdminUser } from "@/lib/admin-api";

interface AdminContextValue {
  admin: AdminUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    try {
      const res = await adminApi.getMe();
      setAdmin(res.success && res.data ? res.data : null);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === "/admin/login";
    if (!admin && !isLoginPage) {
      router.replace("/admin/login");
      return;
    }

    if (admin && isLoginPage) {
      router.replace("/admin");
    }
  }, [admin, loading, pathname, router]);

  const logout = useCallback(async () => {
    await adminApi.logout();
    setAdmin(null);
    router.replace("/admin/login");
  }, [router]);

  const value = useMemo(
    () => ({ admin, loading, refresh, logout }),
    [admin, loading, refresh, logout],
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error("useAdmin must be used within AdminProvider");
  }
  return ctx;
}
