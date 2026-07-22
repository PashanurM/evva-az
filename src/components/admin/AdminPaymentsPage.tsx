"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Info, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminPaymentAccount } from "@/lib/admin-api";
import { sanitizePhoneInput } from "@/lib/phone";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

const emptyForm = {
  id: 0,
  account_title: "Admin kart hesabı",
  bank_name: "",
  card_holder: "",
  card_number: "",
  phone: "",
  whatsapp: "",
  color_theme: "ocean",
  is_active: true,
  sort_order: 100,
};

export function AdminPaymentsPage() {
  const { admin, loading } = useAdmin();
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [items, setItems] = useState<AdminPaymentAccount[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getPaymentAccounts();
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

  async function save() {
    setBusy(-1);
    const isEditing = Boolean(form.id);
    const res = await adminApi.savePaymentAccount({
      ...form,
      id: form.id || undefined,
    });
    if (res.success) {
      toast.success(
        res.data?.message || (isEditing ? "Ödəniş hesabı yeniləndi." : "Ödəniş hesabı yaradıldı."),
      );
      setForm(emptyForm);
      await load();
    } else {
      toast.error(res.error || "Ödəniş hesabı saxlanılmadı");
    }
    setBusy(null);
  }

  async function toggle(id: number, active: boolean) {
    setBusy(id);
    const res = await adminApi.patchPaymentAccount(id, { is_active: active });
    if (res.success) {
      toast.success("Ödəniş hesabı yeniləndi.");
      await load();
    } else {
      toast.error(res.error || "Ödəniş hesabı yenilənmədi");
    }
    setBusy(null);
  }

  async function remove(id: number, title: string) {
    const ok = await confirm({
      title: "Hesabı sil",
      message: `“${title}” ödəniş hesabı silinsin?\n\nBu əməliyyat geri qaytarılmır.`,
    });
    if (!ok) return;
    setBusy(id);
    const res = await adminApi.deletePaymentAccount(id);
    if (res.success) {
      toast.success("Ödəniş hesabı silindi.");
      await load();
    } else {
      toast.error(res.error || "Ödəniş hesabı silinmədi");
    }
    setBusy(null);
  }

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Ödəniş hesabları</span>
          <h1>Platforma ödəniş kartları</h1>
          <p>Rezervasiya ödənişləri üçün admin kart hesabları.</p>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        <section className="admin-panel-card">
          <h2>Yeni hesab</h2>
          <div className="admin-form-grid">
            <label>
              Başlıq
              <input value={form.account_title} onChange={(e) => setForm({ ...form, account_title: e.target.value })} />
            </label>
            <label>
              Bank
              <input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
            </label>
            <label>
              Kart sahibi
              <input value={form.card_holder} onChange={(e) => setForm({ ...form, card_holder: e.target.value })} />
            </label>
            <label>
              Kart nömrəsi
              <input value={form.card_number} onChange={(e) => setForm({ ...form, card_number: e.target.value })} />
            </label>
            <label>
              Telefon
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: sanitizePhoneInput(e.target.value) })}
              />
            </label>
            <label>
              WhatsApp
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: sanitizePhoneInput(e.target.value) })}
              />
            </label>
          </div>
          <div className="admin-toolbar" style={{ marginTop: 12 }}>
            <button type="button" className="admin-btn admin-btn--primary" disabled={busy === -1} onClick={() => void save()}>
              Saxla
            </button>
          </div>
        </section>

        {pageLoading ? (
          <div className="admin-loading">Siyahı yüklənir...</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Başlıq</th>
                  <th>Bank</th>
                  <th>Kart</th>
                  <th>Status</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{a.account_title}</strong></td>
                    <td data-label="Bank">{a.bank_name}</td>
                    <td data-label="Kart">{a.card_number_masked || a.card_holder}</td>
                    <td data-label="Status">
                      <span className={a.is_active ? "admin-badge admin-badge--ok" : "admin-badge"}>
                        {a.is_active ? "Aktiv" : "Deaktiv"}
                      </span>
                    </td>
                    <td>
                      <AdminTableActions
                        info={
                          <Link
                            href={`/admin/payments/${a.id}`}
                            className="admin-btn admin-icon-btn"
                            style={{ textDecoration: "none" }}
                            title="Ətraflı məlumat"
                            aria-label={`${a.account_title} hesabının ətraflı məlumatı`}
                          >
                            <Info size={15} aria-hidden="true" />
                          </Link>
                        }
                      >
                        <Link
                          href={`/admin/payments/${a.id}?edit=1`}
                          className="admin-btn admin-icon-btn"
                          style={{ textDecoration: "none" }}
                          title="Redaktə et"
                          aria-label={`${a.account_title} hesabını redaktə et`}
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </Link>
                        <button
                          type="button"
                          className={`admin-btn admin-icon-btn${a.is_active ? " is-active" : ""}`}
                          title={a.is_active ? "Deaktiv et" : "Aktiv et"}
                          aria-label={a.is_active ? `${a.account_title} hesabını deaktiv et` : `${a.account_title} hesabını aktiv et`}
                          aria-pressed={Boolean(a.is_active)}
                          disabled={busy === a.id}
                          onClick={() => void toggle(a.id, !a.is_active)}
                        >
                          <Power size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger admin-icon-btn"
                          title="Sil"
                          aria-label={`${a.account_title} hesabını sil`}
                          disabled={busy === a.id}
                          onClick={() => void remove(a.id, a.account_title)}
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
