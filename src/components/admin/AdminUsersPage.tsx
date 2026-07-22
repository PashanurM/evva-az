"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Ban, Check, Info, KeyRound, Pencil } from "lucide-react";
import { toast } from "react-toastify";
import {
  adminApi,
  type AdminRegistrationRequest,
  type AdminUserRow,
} from "@/lib/admin-api";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminTableActions } from "@/components/admin/AdminTableActions";
import { useAdmin } from "@/providers/AdminProvider";

function UserTable({
  rows,
  onAction,
  busy,
}: {
  rows: AdminUserRow[];
  busy: number | null;
  onAction: (id: number, action: string) => void;
}) {
  if (!rows.length) {
    return <p style={{ color: "var(--text-muted)", margin: 0 }}>Boş</p>;
  }
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ad</th>
            <th>Rol</th>
            <th>Balans</th>
            <th>Evlər</th>
            <th>Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id}>
              <td>
                <Link
                  href={`/admin/users/${u.id}`}
                  className="admin-table-link"
                  title="İstifadəçi profilinə bax"
                >
                  <strong>{u.full_name || u.username}</strong>
                  <span className="admin-table-link-sub">@{u.username}</span>
                </Link>
              </td>
              <td data-label="Rol">{u.role}</td>
              <td data-label="Balans">{u.wallet_balance.toFixed(2)} ₼</td>
              <td data-label="Evlər">
                <Link href={`/admin/users/${u.id}`} className="admin-table-link">
                  {u.property_count}
                </Link>
              </td>
              <td>
                <AdminTableActions
                  info={
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="admin-btn admin-icon-btn"
                      style={{ textDecoration: "none" }}
                      title="Ətraflı məlumat"
                      aria-label={`${u.full_name || u.username} istifadəçisinin ətraflı məlumatı`}
                    >
                      <Info size={15} aria-hidden="true" />
                    </Link>
                  }
                >
                  <Link
                    href={`/admin/users/${u.id}?edit=1`}
                    className="admin-btn admin-icon-btn"
                    style={{ textDecoration: "none" }}
                    title="Redaktə et"
                    aria-label={`${u.full_name || u.username} istifadəçisini redaktə et`}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </Link>
                  {!u.is_approved && u.role !== "admin" ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary admin-icon-btn"
                      title="Təsdiqlə"
                      aria-label={`${u.full_name || u.username} istifadəçisini təsdiqlə`}
                      disabled={busy === u.id}
                      onClick={() => onAction(u.id, "approve")}
                    >
                      <Check size={15} aria-hidden="true" />
                    </button>
                  ) : null}
                  {u.role !== "admin" ? (
                    <>
                      <button
                        type="button"
                        className="admin-btn admin-icon-btn"
                        title="Blokla"
                        aria-label={`${u.full_name || u.username} istifadəçisini blokla`}
                        disabled={busy === u.id}
                        onClick={() => onAction(u.id, "block")}
                      >
                        <Ban size={15} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-icon-btn"
                        title="Şifrə sıfırla"
                        aria-label={`${u.full_name || u.username} şifrəsini sıfırla`}
                        disabled={busy === u.id}
                        onClick={() => onAction(u.id, "reset_password")}
                      >
                        <KeyRound size={15} aria-hidden="true" />
                      </button>
                    </>
                  ) : null}
                </AdminTableActions>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegistrationRequestTable({
  rows,
  busy,
  onAction,
}: {
  rows: AdminRegistrationRequest[];
  busy: number | null;
  onAction: (id: number, action: "approve" | "reject") => void;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>Username</th>
            <th>Telefon</th>
            <th>Tarix</th>
            <th>Əməliyyat</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((request) => (
            <tr key={request.id}>
              <td><strong>{request.full_name}</strong></td>
              <td data-label="Username">@{request.username}</td>
              <td data-label="Telefon">{request.phone}</td>
              <td data-label="Tarix">{request.created_at}</td>
              <td>
                <AdminTableActions>
                  <button
                    type="button"
                    className="admin-btn admin-btn--primary admin-icon-btn"
                    title="Təsdiqlə və hesab yarat"
                    disabled={busy === request.id}
                    onClick={() => onAction(request.id, "approve")}
                  >
                    <Check size={15} />
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-icon-btn"
                    title="Rədd et"
                    disabled={busy === request.id}
                    onClick={() => onAction(request.id, "reject")}
                  >
                    <Ban size={15} />
                  </button>
                </AdminTableActions>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminUsersPage() {
  const { admin, loading } = useAdmin();
  const [pending, setPending] = useState<AdminUserRow[]>([]);
  const [groups, setGroups] = useState<Record<string, AdminUserRow[]>>({});
  const [registrationRequests, setRegistrationRequests] = useState<AdminRegistrationRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const load = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getUsers();
    if (res.success && res.data) {
      setPending(res.data.pending);
      setGroups(res.data.groups);
      setRegistrationRequests(res.data.registration_requests || []);
      setTotal(res.data.total);
    } else {
      setError(res.error || "Yüklənmədi");
    }
    setPageLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    void load();
  }, [admin, load]);

  async function onAction(id: number, action: string) {
    setBusy(id);
    const res = await adminApi.userAction(id, action);
    if (res.success) {
      if (res.data?.temp_password) {
        toast.info(`Yeni müvəqqəti şifrə: ${res.data.temp_password}`, { autoClose: false });
      } else {
        toast.success(res.data?.message || "İstifadəçi yeniləndi.");
      }
      await load();
    } else {
      toast.error(res.error || "İstifadəçi yenilənmədi");
    }
    setBusy(null);
  }

  async function onRegistrationAction(id: number, action: "approve" | "reject") {
    setBusy(id);
    const res = await adminApi.registrationRequestAction(id, action);
    if (res.success) {
      if (res.data?.temp_password && res.data.user) {
        toast.info(
          `Hesab yaradıldı — ${res.data.user.full_name} | @${res.data.user.username} | ${res.data.user.phone} | Müvəqqəti şifrə: ${res.data.temp_password}`,
          { autoClose: false },
        );
      } else {
        toast.success(res.data?.message || "Sorğu yeniləndi");
      }
      await load();
    } else {
      toast.error(res.error || "Sorğu işlənmədi");
    }
    setBusy(null);
  }

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">İstifadəçilər</span>
          <h1>İstifadəçi idarəetməsi</h1>
          <p>Cəmi {total} istifadəçi — təsdiq, blok və şifrə sıfırlama.</p>
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {pageLoading ? (
          <div className="admin-loading">Siyahı yüklənir...</div>
        ) : (
          <>
            {registrationRequests.length > 0 ? (
              <section className="admin-panel-card">
                <h2>Yeni giriş sorğuları ({registrationRequests.length})</h2>
                <p style={{ color: "var(--text-muted)" }}>
                  Təsdiqlədikdə hesab yaradılır və müvəqqəti şifrə göstərilir.
                </p>
                <RegistrationRequestTable
                  rows={registrationRequests}
                  busy={busy}
                  onAction={(id, action) => void onRegistrationAction(id, action)}
                />
              </section>
            ) : null}

            {pending.length > 0 ? (
              <section className="admin-panel-card">
                <h2>Təsdiq gözləyən ({pending.length})</h2>
                <UserTable rows={pending} busy={busy} onAction={(id, a) => void onAction(id, a)} />
              </section>
            ) : null}

            {(["owner", "user", "admin"] as const).map((role) =>
              groups[role]?.length ? (
                <section key={role} className="admin-panel-card">
                  <h2>{role === "owner" ? "Sahiblər" : role === "admin" ? "Adminlər" : "İstifadəçilər"}</h2>
                  <UserTable rows={groups[role]} busy={busy} onAction={(id, a) => void onAction(id, a)} />
                </section>
              ) : null,
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
