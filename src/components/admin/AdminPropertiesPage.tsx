"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Info, Plus, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminProperty } from "@/lib/admin-api";
import { assetUrl } from "@/lib/assets";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSearchField } from "@/components/admin/AdminSearchField";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminPropertiesPage() {
  const { admin, loading } = useAdmin();
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [items, setItems] = useState<AdminProperty[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getProperties({ status, q: search, sort: "newest" });
    if (res.success && res.data) {
      setItems(res.data.items);
      setSummary(res.data.summary);
    } else {
      setError(res.error || "Yüklənmədi");
    }
    setPageLoading(false);
  }, [status, search]);

  useEffect(() => {
    if (!admin) return;
    void load();
  }, [admin, load]);

  async function toggle(id: number, field: "is_active" | "is_featured", value: boolean) {
    setBusy(id);
    setError("");
    setItems((current) =>
      current.map((property) =>
        property.id === id ? { ...property, [field]: value } : property,
      ),
    );
    const res = await adminApi.patchProperty(id, { [field]: value });
    if (res.success) {
      toast.success("Mülk statusu yeniləndi.");
    } else {
      setItems((current) =>
        current.map((property) =>
          property.id === id ? { ...property, [field]: !value } : property,
        ),
      );
      toast.error(res.error || "Mülk yenilənmədi");
    }
    setBusy(null);
  }

  async function removeProperty(property: AdminProperty) {
    const confirmed = await confirm({
      title: "Mülkü sil",
      message:
        `“${property.title}” mülkü həmişəlik silinsin?\n\n` +
        "Şəkillər, reytinqlər, sevimlilər və mülk söhbətləri də silinəcək. Bu əməliyyat geri qaytarılmır.",
    });
    if (!confirmed) return;

    setBusy(property.id);
    setError("");
    const res = await adminApi.deleteProperty(property.id);

    if (res.success) {
      toast.success(`“${property.title}” silindi.`);
      await load();
    } else {
      toast.error(res.error || "Mülk silinmədi");
    }
    setBusy(null);
  }

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Evlər</span>
          <h1>Mülk idarəetməsi</h1>
          <p>Bütün evlər — yeni əlavə et, redaktə et, aktiv/deaktiv və premium idarəsi.</p>
        </div>

        <div className="admin-summary-row">
          <span className="admin-summary-chip">Cəmi: {summary.total ?? 0}</span>
          <span className="admin-summary-chip">Aktiv: {summary.active ?? 0}</span>
          <span className="admin-summary-chip">Deaktiv: {summary.inactive ?? 0}</span>
          <span className="admin-summary-chip">Premium: {summary.premium ?? 0}</span>
        </div>

        <div className="admin-toolbar admin-toolbar--split">
          <div className="admin-toolbar-group admin-toolbar-group--filters">
            <AdminSearchField
              value={q}
              onChange={setQ}
              placeholder="Axtarış..."
              onSubmit={() => setSearch(q.trim())}
              onClear={() => setSearch("")}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">Hamısı</option>
              <option value="active">Aktiv</option>
              <option value="inactive">Deaktiv</option>
              <option value="premium">Premium</option>
            </select>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => setSearch(q.trim())}>
              Axtar
            </button>
          </div>
          <Link href="/admin/properties/new" className="admin-btn admin-btn--primary admin-btn--nowrap" style={{ textDecoration: "none" }}>
            <Plus size={16} aria-hidden="true" />
            Yeni ev
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
                  <th>Ev</th>
                  <th>Sahib</th>
                  <th>Qiymət</th>
                  <th>Baxış</th>
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
                          <Image src={assetUrl(p.cover_url)} alt="" width={48} height={48} className="admin-thumb" unoptimized />
                        ) : (
                          <div className="admin-thumb" />
                        )}
                        <div>
                          <strong>{p.title}</strong>
                          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.location}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Sahib">
                      {Number(p.owner_user_id) > 0 ? (
                        <Link
                          href={`/admin/users/${Number(p.owner_user_id)}`}
                          className="admin-table-link"
                          title="İstifadəçi profilinə bax"
                        >
                          <strong>{p.owner_name || p.owner_username || "—"}</strong>
                          {p.owner_username && p.owner_name && p.owner_name !== p.owner_username ? (
                            <span className="admin-table-link-sub">@{p.owner_username}</span>
                          ) : null}
                        </Link>
                      ) : (
                        <span>{p.owner_name || "—"}</span>
                      )}
                    </td>
                    <td data-label="Qiymət">{p.price} ₼</td>
                    <td data-label="Baxış">{p.views}</td>
                    <td data-label="Status">
                      <span className="admin-table-badges">
                        <span className={p.is_active ? "admin-badge admin-badge--ok" : "admin-badge"}>
                          {p.is_active ? "Aktiv" : "Deaktiv"}
                        </span>
                        {p.is_featured ? (
                          <span className="admin-badge admin-badge--premium">
                            Premium
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <AdminTableActions
                        info={
                          <Link
                            href={`/admin/properties/${p.id}`}
                            className="admin-btn admin-icon-btn"
                            style={{ textDecoration: "none" }}
                            title="Ətraflı məlumat"
                            aria-label={`${p.title} mülkünün ətraflı məlumatı`}
                          >
                            <Info size={15} aria-hidden="true" />
                          </Link>
                        }
                      >
                        <Link
                          href={`/admin/properties/${p.id}?edit=1`}
                          className="admin-btn admin-icon-btn"
                          style={{ textDecoration: "none" }}
                          title="Redaktə et"
                          aria-label={`${p.title} mülkünü redaktə et`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className={`admin-toggle${p.is_active ? " is-active" : ""}`}
                          title={p.is_active ? "Deaktiv et" : "Aktiv et"}
                          aria-label={p.is_active ? `${p.title} mülkünü deaktiv et` : `${p.title} mülkünü aktiv et`}
                          aria-pressed={p.is_active}
                          disabled={busy === p.id}
                          onClick={() => void toggle(p.id, "is_active", !p.is_active)}
                        />
                        <button
                          type="button"
                          className={`admin-btn admin-icon-btn admin-premium-btn${p.is_featured ? " is-active" : ""}`}
                          title={p.is_featured ? "Premium statusunu sil" : "Premium et"}
                          aria-label={p.is_featured ? `${p.title} premium statusunu sil` : `${p.title} mülkünü premium et`}
                          aria-pressed={p.is_featured}
                          disabled={busy === p.id}
                          onClick={() => void toggle(p.id, "is_featured", !p.is_featured)}
                        >
                          <Star size={15} fill={p.is_featured ? "currentColor" : "none"} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-icon-btn"
                          title="Sil"
                          aria-label={`${p.title} mülkünü sil`}
                          disabled={busy === p.id}
                          onClick={() => void removeProperty(p)}
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
