"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, Pencil } from "lucide-react";
import { adminApi, type AdminChatConversation } from "@/lib/admin-api";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminMessagesPage() {
  const { admin, loading } = useAdmin();
  const [items, setItems] = useState<AdminChatConversation[]>([]);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getChatConversations();
    if (res.success && res.data) {
      setItems(res.data.items);
    } else {
      setError(res.error || "Yüklənmədi");
    }
    setPageLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    void load();
  }, [admin, load]);

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Mesajlar</span>
          <h1>Söhbət siyahısı</h1>
          <p>Qonaq və sahib arasında olan söhbətlər.</p>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {pageLoading ? (
          <div className="admin-loading">Siyahı yüklənir...</div>
        ) : items.length === 0 ? (
          <div className="admin-panel-card">
            <p style={{ margin: 0, color: "var(--text-secondary)" }}>Hələ söhbət yoxdur.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ev</th>
                  <th>Qonaq</th>
                  <th>Sahib</th>
                  <th>Son mesaj</th>
                  <th>Tarix</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td>{c.property_title || `#${c.property_id}`}</td>
                    <td data-label="Qonaq">
                      {c.guest_name || "—"}
                      {c.guest_phone ? <div style={{ fontSize: 12 }}>{c.guest_phone}</div> : null}
                    </td>
                    <td data-label="Sahib">{c.owner_name || "—"}</td>
                    <td data-label="Son mesaj" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.last_message || "—"}
                    </td>
                    <td data-label="Tarix">{c.updated_at}</td>
                    <td>
                      <AdminTableActions
                        info={
                          <Link
                            href={`/admin/messages/${c.id}`}
                            className="admin-btn admin-icon-btn"
                            style={{ textDecoration: "none" }}
                            title="Ətraflı məlumat"
                            aria-label={`#${c.id} söhbətinin ətraflı məlumatı`}
                          >
                            <Info size={15} aria-hidden="true" />
                          </Link>
                        }
                      >
                        <Link
                          href={`/admin/messages/${c.id}?edit=1`}
                          className="admin-btn admin-icon-btn"
                          style={{ textDecoration: "none" }}
                          title="Redaktə et"
                          aria-label={`#${c.id} söhbətini redaktə et`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                      </AdminTableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
