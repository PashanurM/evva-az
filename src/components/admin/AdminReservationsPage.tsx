"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Check, Info, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminBooking } from "@/lib/admin-api";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSearchField } from "@/components/admin/AdminSearchField";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

function canConfirmBooking(b: AdminBooking): boolean {
  if (["approved", "cancelled", "rejected"].includes(b.status)) return false;
  return (
    b.payment_status === "awaiting_site_fee" ||
    b.status === "pending" ||
    b.status === "payment_pending"
  );
}

function bookingStatusBadge(status: string): string {
  if (status === "approved") return "admin-badge admin-badge--ok";
  if (status === "pending" || status === "payment_pending") return "admin-badge admin-badge--warn";
  if (status === "cancelled" || status === "rejected") return "admin-badge";
  return "admin-badge admin-badge--muted";
}

function paymentStatusBadge(status: string): string {
  if (status === "paid" || status === "completed") return "admin-badge admin-badge--ok";
  if (status === "awaiting_site_fee" || status === "pending" || status === "none") {
    return "admin-badge admin-badge--warn";
  }
  return "admin-badge admin-badge--muted";
}

export function AdminReservationsPage() {
  const { admin, loading } = useAdmin();
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getBookings({ status: status || undefined, q: search || undefined });
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

  async function action(id: number, act: string) {
    if (act === "delete") {
      const ok = await confirm({
        title: "Rezervasiyanı sil",
        message: "Bu rezervasiya silinsin?\n\nBu əməliyyat geri qaytarılmır.",
      });
      if (!ok) return;
    }
    if (act === "payment_paid" || act === "approved") {
      const ok = await confirm({
        title: "Rezervasiyanı təsdiqlə",
        message: "Ödəniş alındı və rezervasiya təsdiqlənsin?",
      });
      if (!ok) return;
    }
    setBusy(id);
    const res = await adminApi.bookingAction(id, act);
    if (res.success) {
      toast.success(
        act === "delete"
          ? "Rezervasiya silindi."
          : act === "payment_paid" || act === "approved"
            ? "Rezervasiya təsdiqləndi."
            : "Rezervasiya yeniləndi.",
      );
      await load();
    } else {
      toast.error(res.error || "Rezervasiya əməliyyatı tamamlanmadı");
    }
    setBusy(null);
  }

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Rezervasiyalar</span>
          <h1>Rezervasiya idarəetməsi</h1>
          <p>Ödəniş təsdiqi, ləğv və silmə əməliyyatları.</p>
        </div>

        <div className="admin-summary-row">
          <span className="admin-summary-chip">
            Gözləyən ödəniş: {summary.pending_fee_count ?? 0} ({summary.pending_fee_total ?? 0} ₼)
          </span>
          <span className="admin-summary-chip">
            Ödənilmiş: {summary.paid_fee_count ?? 0} ({summary.paid_fee_total ?? 0} ₼)
          </span>
        </div>

        <div className="admin-toolbar admin-toolbar--split">
          <div className="admin-toolbar-group admin-toolbar-group--filters">
            <AdminSearchField
              value={q}
              onChange={setQ}
              placeholder="Ev, qonaq, sahib..."
              onSubmit={() => setSearch(q.trim())}
              onClear={() => setSearch("")}
            />
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Bütün statuslar</option>
              <option value="pending">Gözləyən</option>
              <option value="payment_pending">Ödəniş gözləyir</option>
              <option value="approved">Təsdiqlənmiş</option>
              <option value="cancelled">Ləğv</option>
              <option value="rejected">Rədd</option>
            </select>
            <button type="button" className="admin-btn admin-btn--primary" onClick={() => setSearch(q.trim())}>
              Axtar
            </button>
          </div>
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
                  <th>Qonaq</th>
                  <th>Tarix</th>
                  <th>Status</th>
                  <th>Ödəniş</th>
                  <th>Platforma</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="admin-table-row-title">
                        <strong>{b.property_title || `#${b.property_id}`}</strong>
                        {b.property_location ? <small>{b.property_location}</small> : null}
                      </div>
                    </td>
                    <td data-label="Qonaq">
                      <div className="admin-table-row-stack">
                        <span>{b.guest_name || "—"}</span>
                        {b.guest_phone ? <small>{b.guest_phone}</small> : null}
                      </div>
                    </td>
                    <td data-label="Tarix">
                      <div className="admin-table-row-stack">
                        <span>{b.check_in}</span>
                        <small>→ {b.check_out}</small>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span className={bookingStatusBadge(b.status)}>{b.status}</span>
                    </td>
                    <td data-label="Ödəniş">
                      <span className={paymentStatusBadge(b.payment_status)}>{b.payment_status}</span>
                    </td>
                    <td data-label="Platforma">{b.platform_fee_total.toFixed(2)} ₼</td>
                    <td>
                      <AdminTableActions
                        info={
                          <>
                            <Link
                              href={`/admin/reservations/${b.id}`}
                              className="admin-btn admin-icon-btn"
                              style={{ textDecoration: "none" }}
                              title="Ətraflı məlumat"
                              aria-label={`#${b.id} rezervasiyasının ətraflı məlumatı`}
                            >
                              <Info size={15} aria-hidden="true" />
                            </Link>
                            {canConfirmBooking(b) ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn--primary admin-icon-btn"
                                title="Təsdiqlə"
                                aria-label={`#${b.id} rezervasiyasını təsdiqlə`}
                                disabled={busy === b.id}
                                onClick={() =>
                                  void action(
                                    b.id,
                                    b.payment_status === "awaiting_site_fee" ||
                                      b.status === "payment_pending"
                                      ? "payment_paid"
                                      : "approved",
                                  )
                                }
                              >
                                <Check size={15} aria-hidden="true" />
                              </button>
                            ) : null}
                          </>
                        }
                      >
                        <Link
                          href={`/admin/reservations/${b.id}?edit=1`}
                          className="admin-btn admin-icon-btn"
                          style={{ textDecoration: "none" }}
                          title="Redaktə et"
                          aria-label={`#${b.id} rezervasiyasını redaktə et`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        {!["cancelled", "rejected"].includes(b.status) ? (
                          <button
                            type="button"
                            className="admin-btn admin-icon-btn"
                            title="Ləğv et"
                            aria-label={`#${b.id} rezervasiyasını ləğv et`}
                            disabled={busy === b.id}
                            onClick={() => void action(b.id, "cancelled")}
                          >
                            <Ban size={15} aria-hidden="true" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-icon-btn"
                          title="Sil"
                          aria-label={`#${b.id} rezervasiyasını sil`}
                          disabled={busy === b.id}
                          onClick={() => void action(b.id, "delete")}
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
