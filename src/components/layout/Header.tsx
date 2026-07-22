"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bike,
  CalendarDays,
  ChevronDown,
  CircleUserRound,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { api } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";
import type { SiteConfig } from "@/lib/types";

const SCROLL_THRESHOLD = 56;
const SCROLL_RANGE = 180;
const SCROLL_SMOOTHING = 0.14;
const MOBILE_NAV_BREAKPOINT = 980;

function syncHeaderHeight(el: HTMLElement) {
  document.documentElement.style.setProperty(
    "--header-height",
    `${el.offsetHeight}px`,
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const { t } = useLocale();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const modules = config?.modules ?? {
    restaurants: true,
    places: true,
    delivery: true,
  };

  useEffect(() => {
    void api.getSiteConfig().then((res) => {
      if (res.success && res.data) setConfig(res.data);
    });
  }, []);

  useEffect(() => {
    let rafId = 0;
    let targetProgress = 0;
    let smoothProgress = 0;

    const applyProgress = (value: number) => {
      document.documentElement.style.setProperty(
        "--header-scroll-progress",
        value.toFixed(4),
      );
      setScrolled(value > SCROLL_THRESHOLD / SCROLL_RANGE);
    };

    const tick = () => {
      smoothProgress += (targetProgress - smoothProgress) * SCROLL_SMOOTHING;

      if (Math.abs(targetProgress - smoothProgress) < 0.001) {
        smoothProgress = targetProgress;
      }

      applyProgress(smoothProgress);

      if (Math.abs(targetProgress - smoothProgress) >= 0.001) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        rafId = 0;
      }
    };

    const updateScroll = () => {
      const y = window.scrollY;
      targetProgress = Math.min(1, Math.max(0, y / SCROLL_RANGE));
      if (!rafId) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      document.documentElement.style.removeProperty("--header-scroll-progress");
    };
  }, []);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const update = () => syncHeaderHeight(el);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [scrolled, loading, user, menuOpen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setMenuOpen(false);
      setProfileOpen(false);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > MOBILE_NAV_BREAKPOINT) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!profileOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  const discoverLinks = (
    <>
      {modules.restaurants && (
        <Link href="/restaurants" className="discover-pill" onClick={() => setMenuOpen(false)}>
          <UtensilsCrossed size={16} aria-hidden />
          <span className="discover-pill-label">{t("nav.restaurants")}</span>
        </Link>
      )}
      {modules.places && (
        <Link href="/places" className="discover-pill" onClick={() => setMenuOpen(false)}>
          <MapPin size={16} aria-hidden />
          <span className="discover-pill-label">{t("nav.places")}</span>
        </Link>
      )}
      {modules.delivery && (
        <Link href="/delivery" className="discover-pill" onClick={() => setMenuOpen(false)}>
          <Bike size={16} aria-hidden />
          <span className="discover-pill-label">{t("nav.delivery")}</span>
        </Link>
      )}
    </>
  );

  const mobileAuthLinks = !loading && user ? (
    <>
      {user.role === "user" && (
        <Link href="/my-bookings" className="auth-btn primary" onClick={() => setMenuOpen(false)}>
          {t("nav.myBookings")}
        </Link>
      )}
      {user.role === "owner" && (
        <Link href="/my-houses" className="auth-btn primary" onClick={() => setMenuOpen(false)}>
          {t("nav.ownerPanel")}
        </Link>
      )}
      <Link href="/messages" className="auth-btn" onClick={() => setMenuOpen(false)}>
        {t("nav.messages")}
      </Link>
      <Link href="/profile" className="auth-btn auth-btn--user" onClick={() => setMenuOpen(false)}>
        {user.full_name || user.username}
      </Link>
      <button
        type="button"
        className="auth-btn"
        onClick={() => {
          setMenuOpen(false);
          void (async () => {
            await logout();
            router.replace("/login");
            router.refresh();
          })();
        }}
      >
        {t("common.logout")}
      </button>
    </>
  ) : (
    !loading && (
      <>
        <Link href="/login" className="auth-btn" onClick={() => setMenuOpen(false)}>
          {t("common.login")}
        </Link>
        <Link href="/register" className="auth-btn primary" onClick={() => setMenuOpen(false)}>
          {t("common.register")}
        </Link>
      </>
    )
  );

  const desktopAuth = !loading && user ? (
    <div className={`profile-menu${profileOpen ? " is-open" : ""}`} ref={profileMenuRef}>
      <button
        type="button"
        className="profile-menu-trigger"
        aria-label={t("nav.account")}
        aria-haspopup="menu"
        aria-expanded={profileOpen}
        onClick={() => setProfileOpen((open) => !open)}
      >
        <CircleUserRound size={21} aria-hidden />
        <ChevronDown className="profile-menu-chevron" size={14} aria-hidden />
      </button>

      <div className="profile-menu-dropdown" role="menu">
        <Link href="/profile" className="profile-menu-identity" role="menuitem">
          <span className="profile-menu-avatar"><UserRound size={20} aria-hidden /></span>
          <span>
            <strong>{user.full_name || user.username}</strong>
            {user.username && <small>@{user.username}</small>}
          </span>
        </Link>

        <div className="profile-menu-divider" />

        {user.role === "user" && (
          <Link href="/my-bookings" className="profile-menu-item" role="menuitem">
            <CalendarDays size={18} aria-hidden />
            {t("nav.myBookings")}
          </Link>
        )}
        {user.role === "owner" && (
          <Link href="/my-houses" className="profile-menu-item" role="menuitem">
            <CalendarDays size={18} aria-hidden />
            {t("nav.ownerPanel")}
          </Link>
        )}
        <Link href="/messages" className="profile-menu-item" role="menuitem">
          <MessageSquare size={18} aria-hidden />
          {t("nav.messages")}
        </Link>

        <div className="profile-menu-divider" />

        <button
          type="button"
          className="profile-menu-item profile-menu-logout"
          role="menuitem"
          onClick={() => {
            setProfileOpen(false);
            void (async () => {
              await logout();
              router.replace("/login");
              router.refresh();
            })();
          }}
        >
          <LogOut size={18} aria-hidden />
          {t("common.logout")}
        </button>
      </div>
    </div>
  ) : (
    !loading && (
      <>
        <Link href="/login" className="auth-btn">
          {t("common.login")}
        </Link>
        <Link href="/register" className="auth-btn primary">
          {t("common.register")}
        </Link>
      </>
    )
  );

  return (
    <header
      ref={headerRef}
      className={`top-bar${scrolled ? " top-bar--scrolled" : ""}${menuOpen ? " top-bar--menu-open" : ""}`}
    >
      <div className="top-bar-track">
        <div className="top-bar-inner">
          <div className="nav-shell">
            <Link href="/" className="logo full-logo">
              <Image
                className="site-logo-mark"
                src="/assets/evva-logo-mark.png"
                alt="EVVA.AZ logo"
                width={52}
                height={52}
                unoptimized
              />
              <div className="logo-text">
                <span className="logo-title">EVVA.AZ</span>
              </div>
            </Link>

            <div className="header-actions header-actions--desktop">
              <div className="discover-pills">{discoverLinks}</div>
              <LanguageSwitcher variant="nav" />
              <ThemeToggle />
              {desktopAuth}
            </div>

            <div className="header-actions header-actions--compact">
              <LanguageSwitcher variant="nav" />
              <ThemeToggle />
              <button
                type="button"
                className="nav-menu-toggle"
                aria-expanded={menuOpen}
                aria-controls="nav-mobile-drawer"
                aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
                onClick={() => setMenuOpen((open) => !open)}
              >
                {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`nav-mobile-backdrop${menuOpen ? " open" : ""}`}
        aria-label={t("nav.closeMenu")}
        tabIndex={menuOpen ? 0 : -1}
        onClick={() => setMenuOpen(false)}
      />

      <nav
        id="nav-mobile-drawer"
        className={`nav-mobile-drawer${menuOpen ? " open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="nav-mobile-section">
          <span className="nav-mobile-label">{t("nav.discover")}</span>
          <div className="nav-mobile-links">{discoverLinks}</div>
        </div>
        <div className="nav-mobile-section">
          <span className="nav-mobile-label">{t("language.label")}</span>
          <LanguageSwitcher variant="menu" />
        </div>
        <div className="nav-mobile-section">
          <span className="nav-mobile-label">{t("nav.account")}</span>
          <div className="nav-mobile-links nav-mobile-auth">{mobileAuthLinks}</div>
        </div>
      </nav>
    </header>
  );
}
