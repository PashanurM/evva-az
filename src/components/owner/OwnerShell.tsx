"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Building2,
  CalendarCheck,
  ExternalLink,
  Menu,
  MessageSquare,
  Wallet,
  X,
} from "lucide-react";
import { UnreadDot } from "@/components/chat/UnreadDot";
import { useUnreadMessages } from "@/providers/UnreadMessagesProvider";

const NAV = [
  { href: "/my-houses", label: "Evlərim", icon: Building2, exact: true },
  { href: "/my-houses/reservations", label: "Rezervasiyalar", icon: CalendarCheck },
  { href: "/my-houses/wallet", label: "Balans / Premium", icon: Wallet },
  { href: "/messages", label: "Mesajlar", icon: MessageSquare },
];

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { hasUnread } = useUnreadMessages();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="owner-shell">
      <aside className={`owner-shell-nav${open ? " is-open" : ""}`}>
        <div className="owner-shell-nav-head">
          <strong>Ev sahibi paneli</strong>
          <button
            type="button"
            className="owner-shell-close"
            aria-label="Menyunu bağla"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`owner-shell-link${active ? " is-active" : ""}`}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} aria-hidden />
                <span>{item.label}</span>
                {item.href === "/messages" ? (
                  <UnreadDot show={hasUnread} className="evva-unread-dot--corner" />
                ) : null}
              </Link>
            );
          })}
          <Link
            href="/"
            className="owner-shell-link owner-shell-link--site"
            onClick={() => setOpen(false)}
          >
            <ExternalLink size={17} aria-hidden />
            <span>Sayta bax</span>
          </Link>
        </nav>
      </aside>

      {open ? (
        <button
          type="button"
          className="owner-shell-backdrop"
          aria-label="Menyunu bağla"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="owner-shell-main">
        <div className="owner-shell-topbar">
          <button
            type="button"
            className="owner-shell-menu-btn"
            aria-label="Menyu"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
            Panel menyusu
          </button>
          <Link href="/" className="auth-btn owner-shell-browse">
            <ExternalLink size={16} aria-hidden />
            Sayta bax
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
