"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminSectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const { admin, loading } = useAdmin();

  if (loading) {
    return <div className="admin-loading">Yüklənir...</div>;
  }

  if (!admin) {
    return null;
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Admin</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="admin-placeholder">
          Bu bölmə Next.js admin panelinə köçürülür. Backend PHP API üzərindən idarə olunacaq.
        </div>
      </div>
    </AdminShell>
  );
}
