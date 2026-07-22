"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  UtensilsCrossed,
  Users,
  X,
} from "lucide-react";
import { useAdmin } from "@/providers/AdminProvider";

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
  const { admin, logout } = useAdmin();
  const [menuOpen, setMenuOpen] = useState(false);

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
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

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
            <Link href="/" className="admin-nav-link admin-nav-link--ghost admin-nav-link--site" aria-label="Sayta qayıt">
              <Home size={16} aria-hidden />
              <span className="admin-header-action-label">Sayta qayıt</span>
            </Link>
            {admin && (
              <span className="admin-user-chip">{admin.full_name || admin.username}</span>
            )}
            <button type="button" className="admin-nav-link admin-nav-link--ghost" onClick={() => void logout()} aria-label="Çıxış">
              <LogOut size={16} aria-hidden />
              <span className="admin-header-action-label">Çıxış</span>
            </button>
            <button
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

        <nav
          id="admin-nav-panel"
          className={`admin-nav-panel${menuOpen ? " is-open" : ""}`}
          aria-label="Admin navigation"
          aria-hidden={!menuOpen}
        >
          <div className="admin-nav-panel-scroll">{navLinks}</div>
        </nav>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Menyunu bağla"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="admin-app-main">{children}</main>
    </div>
  );
}
