"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bike,
  Building2,
  CalendarCheck,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Shield,
  UserRound,
  UtensilsCrossed,
  Users,
  X,
} from "lucide-react";
import { UnreadDot } from "@/components/chat/UnreadDot";
import { useAdmin } from "@/providers/AdminProvider";
import { useAuth } from "@/providers/AuthProvider";
import { adminApi } from "@/lib/admin-api";
import { api } from "@/lib/api";
import { markAdminOwnerMode } from "@/lib/auth-redirect";

const NAV_ITEMS = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard, exact: true },
  { href: "/admin/properties", label: "Evlər", icon: Building2 },
  { href: "/admin/users", label: "İstifadəçilər", icon: Users },
  { href: "/admin/reservations", label: "Rezervasiyalar", icon: CalendarCheck },
  { href: "/admin/restaurants", label: "Restoranlar", icon: UtensilsCrossed },
  { href: "/admin/places", label: "Görməli yerlər", icon: MapPin },
  { href: "/admin/payments", label: "Ödəniş", icon: CreditCard },
  { href: "/admin/messages", label: "Mesajlar", icon: MessageSquare },
  { href: "/admin/delivery", label: "Delivery", icon: Bike },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAdmin();
  const { applyUser, refresh: refreshPublicAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const navPanelRef = useRef<HTMLElement>(null);

  const [tipKey, setTipKey] = useState<string | null>(null);
  const tipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasUnread, setHasUnread] = useState(false);

  function showTip(key: string) {
    setTipKey(key);
    if (tipTimer.current) clearTimeout(tipTimer.current);
    tipTimer.current = setTimeout(() => setTipKey(null), 1800);
  }

  useEffect(() => {
    return () => {
      if (tipTimer.current) clearTimeout(tipTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!admin) {
      setHasUnread(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const res = await adminApi.getChatUnread();
        if (cancelled) return;
        setHasUnread(Boolean(res.success && (res.data?.unread_count || 0) > 0));
      } catch {
        if (!cancelled) setHasUnread(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [admin, pathname]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMenuOpen(false));
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (navPanelRef.current?.contains(target)) return;
      if (menuToggleRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  async function switchToOwnerProfile() {
    if (switching) return;
    setSwitching(true);
    setMenuOpen(false);
    try {
      const res = await api.switchMode("owner");
      if (!res.success || !res.data) return;
      markAdminOwnerMode(true);
      if (res.data.user) {
        applyUser(res.data.user);
      } else {
        await refreshPublicAuth();
      }
      router.replace(res.data.redirect || "/my-houses");
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  const navLinks = NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        className={`admin-nav-link${active ? " active" : ""}`}
        onClick={() => setMenuOpen(false)}
      >
        <Icon size={16} />
        <span>{label}</span>
        {href === "/admin/messages" ? (
          <UnreadDot show={hasUnread} className="evva-unread-dot--corner" />
        ) : null}
      </Link>
    );
  });

  return (
    <div className={`admin-app${menuOpen ? " admin-app--menu-open" : ""}`}>
      <header className="admin-app-header">
        <div className="admin-app-header-top">
          <Link href="/admin" className="admin-brand">
            <span className="admin-brand-mark">
              <Shield size={18} />
            </span>
            <span className="admin-brand-text">
              <strong>EVVA Admin</strong>
              <small>İdarəetmə paneli</small>
            </span>
          </Link>

          <div className="admin-header-actions">
            <button
              type="button"
              className={`admin-nav-link admin-nav-link--ghost admin-header-icon-btn${tipKey === "owner" ? " is-tip-open" : ""}`}
              disabled={switching}
              onClick={() => void switchToOwnerProfile()}
              onPointerDown={() => showTip("owner")}
              aria-label="Ev sahibi profilinə keç"
              title="Ev sahibi profilinə keç"
              data-tooltip="Ev sahibi profilinə keç"
            >
              <UserRound size={16} aria-hidden />
              <span className="admin-header-action-label">
                {switching ? "Keçilir..." : "Ev sahibi profili"}
              </span>
            </button>
            <Link
              href="/"
              className={`admin-nav-link admin-nav-link--ghost admin-nav-link--site admin-header-icon-btn${tipKey === "site" ? " is-tip-open" : ""}`}
              onPointerDown={() => showTip("site")}
              aria-label="Sayta qayıt"
              title="Sayta qayıt"
              data-tooltip="Sayta qayıt"
            >
              <Home size={16} aria-hidden />
              <span className="admin-header-action-label">Sayta qayıt</span>
            </Link>
            {admin && (
              <span className="admin-user-chip">{admin.full_name || admin.username}</span>
            )}
            <button
              type="button"
              className={`admin-nav-link admin-nav-link--ghost admin-header-icon-btn${tipKey === "logout" ? " is-tip-open" : ""}`}
              onClick={() => void logout()}
              onPointerDown={() => showTip("logout")}
              aria-label="Çıxış"
              title="Çıxış"
              data-tooltip="Çıxış"
            >
              <LogOut size={16} aria-hidden />
              <span className="admin-header-action-label">Çıxış</span>
            </button>
            <button
              ref={menuToggleRef}
              type="button"
              className="admin-nav-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="admin-nav-panel"
              aria-label={menuOpen ? "Menyunu bağla" : "Menyunu aç"}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={18} aria-hidden /> : <Menu size={18} aria-hidden />}
              <span>Menyu</span>
            </button>
          </div>
        </div>

        <nav className="admin-nav admin-nav--desktop" aria-label="Admin navigation">
          {navLinks}
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="admin-nav-backdrop"
            aria-label="Menyunu bağla"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <nav
          ref={navPanelRef}
          id="admin-nav-panel"
          className={`admin-nav-panel${menuOpen ? " is-open" : ""}`}
          aria-label="Admin navigation"
          aria-hidden={!menuOpen}
        >
          <div className="admin-nav-panel-scroll">{navLinks}</div>
        </nav>
      </header>

      <main className="admin-app-main">{children}</main>
    </div>
  );
}
