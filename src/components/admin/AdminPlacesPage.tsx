"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminPlace } from "@/lib/admin-api";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminPlacesPage() {
  const { admin, loading } = useAdmin();
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [items, setItems] = useState<AdminPlace[]>([]);
  const [moduleActive, setModuleActive] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getPlaces();
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
      current.map((place) => place.id === id ? { ...place, [field]: value } : place),
    );
    const detail = await adminApi.getEntityDetail("places", id);
    const res =
      detail.success && detail.data
        ? await adminApi.updateEntity("places", id, { ...detail.data.entity, [field]: value })
        : detail;
    if (res.success) {
      toast.success("Məkan yeniləndi.");
    } else {
      setItems((current) =>
        current.map((place) => place.id === id ? { ...place, [field]: !value } : place),
      );
      toast.error(res.error || "Məkan yenilənmədi");
    }
    setBusy(null);
  }

  async function remove(id: number, title: string) {
    const ok = await confirm({
      title: "Məkanı sil",
      message: `“${title}” məkanı silinsin?\n\nBu əməliyyat geri qaytarılmır.`,
    });
    if (!ok) return;
    setBusy(id);
    const res = await adminApi.deletePlace(id);
    if (res.success) {
      toast.success("Məkan silindi.");
      await load();
    } else {
      toast.error(res.error || "Məkan silinmədi");
    }
    setBusy(null);
  }

  async function toggleModule() {
    setBusy(-2);
    const res = await adminApi.patchModule("places", !moduleActive);
    if (res.success) {
      toast.success("Məkan modulu yeniləndi.");
      await load();
    } else {
      toast.error(res.error || "Məkan modulu yenilənmədi");
    }
    setBusy(null);
  }

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Görməli yerlər</span>
          <h1>Məkan idarəetməsi</h1>
          <p>Görməli yerlər modulu və məkan siyahısı.</p>
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
          <Link href="/admin/places/new" className="admin-btn admin-btn--primary admin-btn--nowrap" style={{ textDecoration: "none" }}>
              <Plus size={16} /> Yeni məkan
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
                  <th>Məkan</th>
                  <th>Kateqoriya</th>
                  <th>Qiymət</th>
                  <th>Reytinq</th>
                  <th>Status</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {p.cover_url ? (
                          <Image src={p.cover_url} alt="" width={48} height={48} className="admin-thumb" unoptimized />
                        ) : (
                          <div className="admin-thumb" />
                        )}
                        <strong>{p.title}</strong>
                      </div>
                    </td>
                    <td data-label="Kateqoriya">{p.category || "—"}</td>
                    <td data-label="Qiymət">{p.entry_price > 0 ? `${p.entry_price} ₼` : "Pulsuz"}</td>
                    <td data-label="Reytinq">{p.avg_rating} ({p.rating_count})</td>
                    <td data-label="Status">
                      <span className={p.is_active ? "admin-badge admin-badge--ok" : "admin-badge"}>
                        {p.is_active ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td>
                      <AdminTableActions
                        info={
                          <Link
                            href={`/admin/places/${p.id}`}
                            className="admin-btn admin-icon-btn"
                            style={{ textDecoration: "none" }}
                            title="Ətraflı məlumat"
                            aria-label={`${p.title} məkanının ətraflı məlumatı`}
                          >
                            <Info size={15} aria-hidden="true" />
                          </Link>
                        }
                      >
                        <Link
                          href={`/admin/places/${p.id}?edit=1`}
                          className="admin-btn admin-icon-btn"
                          style={{ textDecoration: "none" }}
                          title="Redaktə et"
                          aria-label={`${p.title} məkanını redaktə et`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className={`admin-toggle${p.is_active ? " is-active" : ""}`}
                          title={p.is_active ? "Deaktiv et" : "Aktiv et"}
                          aria-label={p.is_active ? `${p.title} məkanını deaktiv et` : `${p.title} məkanını aktiv et`}
                          aria-pressed={p.is_active}
                          disabled={busy === p.id}
                          onClick={() => void toggle(p.id, "is_active", !p.is_active)}
                        />
                        <button
                          type="button"
                          className={`admin-btn admin-icon-btn admin-premium-btn${p.is_featured ? " is-active" : ""}`}
                          title={p.is_featured ? "Premium statusunu sil" : "Premium et"}
                          aria-label={p.is_featured ? `${p.title} premium statusunu sil` : `${p.title} məkanını premium et`}
                          aria-pressed={p.is_featured}
                          disabled={busy === p.id}
                          onClick={() => void toggle(p.id, "is_featured", !p.is_featured)}
                        >
                          <Star size={15} fill={p.is_featured ? "currentColor" : "none"} />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-icon-btn"
                          title="Sil"
                          aria-label={`${p.title} məkanını sil`}
                          disabled={busy === p.id}
                          onClick={() => void remove(p.id, p.title)}
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
