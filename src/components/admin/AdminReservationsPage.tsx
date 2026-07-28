"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Info, Pencil, Trash2, Wallet } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminBooking } from "@/lib/admin-api";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminSearchField } from "@/components/admin/AdminSearchField";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

function bookingStatusLabel(status: string): string {
  if (status === "approved") return "Təsdiqlənib";
  if (status === "pending" || status === "payment_pending") return "Təsdiq gözləyir";
  if (status === "cancelled" || status === "rejected") return "Ləğv edilib";
  return status;
}

function paymentStatusLabel(status: string): string {
  if (status === "site_fee_paid") return "Platforma ödənişi edilib";
  if (status === "awaiting_site_fee") return "Platforma ödənişi gözləyir";
  if (status === "cancelled") return "Ləğv edilib";
  if (status === "none") return "—";
  return status;
}

function bookingStatusBadge(status: string): string {
  if (status === "approved") return "admin-badge admin-badge--ok";
  if (status === "pending" || status === "payment_pending") return "admin-badge admin-badge--warn";
  if (status === "cancelled" || status === "rejected") return "admin-badge";
  return "admin-badge admin-badge--muted";
}

function paymentStatusBadge(status: string): string {
  if (status === "site_fee_paid") return "admin-badge admin-badge--ok";
  if (status === "awaiting_site_fee") return "admin-badge admin-badge--warn";
  if (status === "cancelled") return "admin-badge";
  return "admin-badge admin-badge--muted";
}

export function AdminReservationsPage() {
  const { admin, loading } = useAdmin();
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getBookings({
      status: status || undefined,
      payment_status: paymentStatus || undefined,
      q: search || undefined,
    });
    if (res.success && res.data) {
      setItems(res.data.items);
      setSummary(res.data.summary);
    } else {
      setError(res.error || "Yüklənmədi");
    }
    setPageLoading(false);
  }, [status, paymentStatus, search]);

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
    if (act === "cancelled") {
      const ok = await confirm({
        title: "Rezervasiyanı ləğv et",
        message: "Bu rezervasiya ləğv edilsin?",
      });
      if (!ok) return;
    }
    setBusy(id);
    const res = await adminApi.bookingAction(id, act);
    if (res.success) {
      toast.success(
        act === "delete"
          ? "Rezervasiya silindi."
          : act === "cancelled"
            ? "Rezervasiya ləğv edildi."
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

  const paidTotal = Number(summary.paid_fee_total ?? 0);
  const pendingTotal = Number(summary.pending_fee_total ?? 0);

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Rezervasiyalar</span>
          <h1>Rezervasiya idarəetməsi</h1>
          <p>
            Ev sahibi təsdiqindən sonra platforma ödənişini buradan izləyin.
            Ödəniş statusunu ətraflı səhifədən dəyişə bilərsiniz.
          </p>
        </div>

        <div className="admin-summary-row admin-summary-row--earnings">
          <div className="admin-summary-card admin-summary-card--ok">
            <Wallet size={18} aria-hidden />
            <div>
              <small>Ümumi qazanc</small>
              <strong>{paidTotal.toFixed(2)} ₼</strong>
              <span>{summary.paid_fee_count ?? 0} ödəniş (platforma ödənişi edilib)</span>
            </div>
          </div>
          <div className="admin-summary-card admin-summary-card--warn">
            <Wallet size={18} aria-hidden />
            <div>
              <small>Gözləmədə olan qazanc</small>
              <strong>{pendingTotal.toFixed(2)} ₼</strong>
              <span>{summary.pending_fee_count ?? 0} gözləyən (platforma ödənişi gözləyir)</span>
            </div>
          </div>
        </div>

        <div className="admin-panel-card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, lineHeight: 1.55 }}>
            <strong>Sayt ödənişi necə olur?</strong> Ev sahibi rezervi təsdiqləyəndə status
            “Təsdiq gözləyir”, ödəniş isə “Platforma ödənişi gözləyir” olur. Admin ödənişi
            aldıqdan sonra rezervasiyanın ödəniş statusunu “Platforma ödənişi edilib” edir —
            bu məbləğ ümumi qazanca düşür.
          </p>
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
              <option value="awaiting_confirm">Təsdiq gözləyir</option>
              <option value="approved">Təsdiqlənib</option>
              <option value="cancelled">Ləğv edilib</option>
            </select>
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">Bütün ödənişlər</option>
              <option value="awaiting_site_fee">Platforma ödənişi gözləyir</option>
              <option value="site_fee_paid">Platforma ödənişi edilib</option>
              <option value="cancelled">Ləğv edilib</option>
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
                  <th>Ödəniş statusu</th>
                  <th>Platforma haqqı</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 28 }}>
                      Rezervasiya tapılmadı.
                    </td>
                  </tr>
                ) : null}
                {items.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div className="admin-table-row-title">
                        <strong>{b.property_title || `#${b.property_id}`}</strong>
                        {b.property_location ? <small>{b.property_location}</small> : null}
                        {b.owner_name ? <small>Sahib: {b.owner_name}</small> : null}
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
                      <span className={bookingStatusBadge(b.status)}>
                        {bookingStatusLabel(b.status)}
                      </span>
                    </td>
                    <td data-label="Ödəniş statusu">
                      <span className={paymentStatusBadge(b.payment_status)}>
                        {paymentStatusLabel(b.payment_status)}
                      </span>
                    </td>
                    <td data-label="Platforma haqqı">{Number(b.platform_fee_total || 0).toFixed(2)} ₼</td>
                    <td>
                      <AdminTableActions
                        info={
                          <Link
                            href={`/admin/reservations/${b.id}`}
                            className="admin-btn admin-icon-btn"
                            style={{ textDecoration: "none" }}
                            title="Ətraflı məlumat"
                            aria-label={`#${b.id} rezervasiyasının ətraflı məlumatı`}
                          >
                            <Info size={15} aria-hidden="true" />
                          </Link>
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
