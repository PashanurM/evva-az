"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminRestaurant } from "@/lib/admin-api";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminRestaurantsPage() {
  const { admin, loading } = useAdmin();
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [items, setItems] = useState<AdminRestaurant[]>([]);
  const [moduleActive, setModuleActive] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getRestaurants();
    if (res.success && res.data) {
      setItems(res.data.items);
      setModuleActive(res.data.module_active);
    } else {
      setError(res.error || "Yüklənmədi");
    }
    setPageLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    void load();
  }, [admin, load]);

  async function toggle(id: number, field: "is_active" | "is_featured", value: boolean) {
    setBusy(id);
    setItems((current) =>
      current.map((restaurant) =>
        restaurant.id === id ? { ...restaurant, [field]: value } : restaurant,
      ),
    );
    const res = await adminApi.patchRestaurant(id, { [field]: value });
    if (res.success) {
      toast.success("Restoran yeniləndi.");
    } else {
      setItems((current) =>
        current.map((restaurant) =>
          restaurant.id === id ? { ...restaurant, [field]: !value } : restaurant,
        ),
      );
      toast.error(res.error || "Restoran yenilənmədi");
    }
    setBusy(null);
  }

  async function toggleModule() {
    setBusy(-2);
    const res = await adminApi.patchModule("restaurants", !moduleActive);
    if (res.success) {
      toast.success("Restoran modulu yeniləndi.");
      await load();
    } else {
      toast.error(res.error || "Restoran modulu yenilənmədi");
    }
    setBusy(null);
  }

  async function remove(restaurant: AdminRestaurant) {
    const ok = await confirm({
      title: "Restoranı sil",
      message: `“${restaurant.name}” restoranı silinsin?\n\nBu əməliyyat geri qaytarılmır.`,
    });
    if (!ok) return;
    setBusy(restaurant.id);
    const res = await adminApi.deleteRestaurant(restaurant.id);
    if (res.success) {
      toast.success("Restoran silindi.");
      await load();
    } else {
      toast.error(res.error || "Restoran silinmədi");
    }
    setBusy(null);
  }

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Restoranlar</span>
          <h1>Restoran idarəetməsi</h1>
          <p>Modul statusu, yeni restoran və aktiv/deaktiv idarəsi.</p>
        </div>

        <div className="admin-toolbar admin-toolbar--split">
          <div className="admin-toolbar-group">
            <span className={moduleActive ? "admin-badge admin-badge--ok" : "admin-badge"}>
              Modul: {moduleActive ? "Aktiv" : "Deaktiv"}
            </span>
            <button type="button" className="admin-btn" disabled={busy === -2} onClick={() => void toggleModule()}>
              Modulu {moduleActive ? "söndür" : "aç"}
            </button>
          </div>
          <Link href="/admin/restaurants/new" className="admin-btn admin-btn--primary admin-btn--nowrap" style={{ textDecoration: "none" }}>
              <Plus size={16} /> Yeni restoran
          </Link>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {pageLoading ? (
          <div className="admin-loading">Siyahı yüklənir...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ad</th>
                  <th>Ünvan</th>
                  <th>Menyu</th>
                  <th>Menecerlər</th>
                  <th>Status</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong></td>
                    <td data-label="Ünvan">{r.location || "—"}</td>
                    <td data-label="Menyu">{r.menu_count}</td>
                    <td data-label="Menecerlər">{r.manager_names || "—"}</td>
                    <td data-label="Status">
                      <span className={r.is_active ? "admin-badge admin-badge--ok" : "admin-badge"}>
                        {r.is_active ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td>
                      <AdminTableActions
                        info={
                          <Link
                            href={`/admin/restaurants/${r.id}`}
                            className="admin-btn admin-icon-btn"
                            style={{ textDecoration: "none" }}
                            title="Ətraflı məlumat"
                            aria-label={`${r.name} restoranının ətraflı məlumatı`}
                          >
                            <Info size={15} aria-hidden="true" />
                          </Link>
                        }
                      >
                        <Link
                          href={`/admin/restaurants/${r.id}?edit=1`}
                          className="admin-btn admin-icon-btn"
                          style={{ textDecoration: "none" }}
                          title="Redaktə et"
                          aria-label={`${r.name} restoranını redaktə et`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className={`admin-toggle${r.is_active ? " is-active" : ""}`}
                          title={r.is_active ? "Deaktiv et" : "Aktiv et"}
                          aria-label={r.is_active ? `${r.name} restoranını deaktiv et` : `${r.name} restoranını aktiv et`}
                          aria-pressed={r.is_active}
                          disabled={busy === r.id}
                          onClick={() => void toggle(r.id, "is_active", !r.is_active)}
                        />
                        <button
                          type="button"
                          className={`admin-btn admin-icon-btn admin-premium-btn${r.is_featured ? " is-active" : ""}`}
                          title={r.is_featured ? "Premium statusunu sil" : "Premium et"}
                          aria-label={r.is_featured ? `${r.name} premium statusunu sil` : `${r.name} restoranını premium et`}
                          aria-pressed={r.is_featured}
                          disabled={busy === r.id}
                          onClick={() => void toggle(r.id, "is_featured", !r.is_featured)}
                        >
                          <Star size={15} fill={r.is_featured ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-icon-btn"
                          title="Sil"
                          aria-label={`${r.name} restoranını sil`}
                          disabled={busy === r.id}
                          onClick={() => void remove(r)}
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {confirmModal}
    </AdminShell>
  );
}
