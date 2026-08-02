"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarCheck,
  Eye,
  Heart,
  MapPin,
  Package,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { adminApi, type AdminDashboard, type AdminDashboardNotification } from "@/lib/admin-api";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdmin } from "@/providers/AdminProvider";

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: typeof Building2;
  href: string;
}) {
  return (
    <Link href={href} className="admin-stat-card" aria-label={`${label} səhifəsinə keç`}>
      <div className="admin-stat-icon">
        <Icon size={18} aria-hidden="true" />
      </div>
      <div>
        <p className="admin-stat-label">{label}</p>
        <strong className="admin-stat-value">{value}</strong>
        {hint ? <span className="admin-stat-hint">{hint}</span> : null}
      </div>
    </Link>
  );
}

function notificationHref(item: AdminDashboardNotification): string {
  if (item.type === "booking") return `/admin/reservations/${item.id}`;
  if (item.type === "delivery_order") return "/admin/delivery";
  return "/admin";
}

function notificationLabel(item: AdminDashboardNotification): string {
  if (item.type === "booking") return "Yeni rezerv";
  if (item.type === "delivery_order") return "Yeni delivery";
  return "Bildiriş";
}

export function AdminDashboardPage() {
  const { admin, loading } = useAdmin();
  const [stats, setStats] = useState<AdminDashboard | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!admin) return;
    void adminApi.getDashboard().then((res) => {
      setStats(res.success && res.data ? res.data : null);
      setStatsLoading(false);
    });
  }, [admin]);

  if (loading) {
    return <div className="admin-loading">Yüklənir...</div>;
  }

  if (!admin) {
    return null;
  }

  const notifications = stats?.notifications || [];

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <div>
            <span className="section-kicker">Dashboard</span>
            <h1>Xoş gəldin, {admin.full_name || admin.username}</h1>
          </div>
        </div>

        {statsLoading ? (
          <div className="admin-loading">Statistika yüklənir...</div>
        ) : stats ? (
          <>
            <div className="admin-stat-grid">
              <StatCard
                label="Evlər"
                value={stats.properties}
                hint={`${stats.inactive_properties} deaktiv`}
                icon={Building2}
                href="/admin/properties"
              />
              <StatCard
                label="İstifadəçilər"
                value={stats.users}
                hint={`${stats.pending_users} təsdiq gözləyir`}
                icon={Users}
                href="/admin/users"
              />
              <StatCard
                label="Rezervasiyalar"
                value={stats.bookings}
                hint={`Bu gün: ${stats.bookings_today ?? 0} · ${stats.pending_bookings} gözləyən`}
                icon={CalendarCheck}
                href="/admin/reservations"
              />
              <StatCard
                label="Delivery bu gün"
                value={stats.delivery_orders_today ?? 0}
                hint="Bugünkü sifarişlər"
                icon={Package}
                href="/admin/delivery"
              />
              <StatCard label="Sevimlilər" value={stats.favorites} icon={Heart} href="/admin/properties" />
              <StatCard
                label="Sayt girişləri"
                value={stats.site_visits_total ?? 0}
                hint={`Bu gün: ${stats.site_visits_today ?? 0}`}
                icon={Eye}
                href="/admin"
              />
              <StatCard
                label="Ev baxışları"
                value={stats.property_views_total ?? 0}
                hint="Bütün elanların ümumi baxışı"
                icon={Eye}
                href="/admin/properties"
              />
              <StatCard label="Restoranlar" value={stats.restaurants} icon={UtensilsCrossed} href="/admin/restaurants" />
              <StatCard label="Görməli yerlər" value={stats.places} icon={MapPin} href="/admin/places" />
            </div>

            <div className="admin-dashboard-split">
              <section className="admin-panel-card">
                <h2>
                  <Bell size={18} aria-hidden /> Son bildirişlər
                </h2>
                {notifications.length === 0 ? (
                  <p className="admin-muted">Yeni bildiriş yoxdur.</p>
                ) : (
                  <ul className="admin-notification-list">
                    {notifications.map((item) => (
                      <li key={`${item.type}-${item.id}`}>
                        <Link href={notificationHref(item)} className="admin-notification-item">
                          <span className={`admin-notification-type admin-notification-type--${item.type}`}>
                            {notificationLabel(item)}
                          </span>
                          <strong>{item.title}</strong>
                          <time>{item.created_at}</time>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="admin-panel-card">
                <h2>Modul statusu</h2>
                <div className="admin-module-list">
                  {Object.entries(stats.modules).map(([key, active]) => (
                    <div key={key} className="admin-module-item">
                      <span>{key}</span>
                      <span className={active ? "admin-badge admin-badge--ok" : "admin-badge"}>
                        {active ? "Aktiv" : "Deaktiv"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="alert alert-error">Statistika yüklənmədi.</div>
        )}
      </div>
    </AdminShell>
  );
}
