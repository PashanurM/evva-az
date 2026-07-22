"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPropertyForm } from "@/components/admin/AdminPropertyForm";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminPropertyCreatePage() {
  const { admin, loading } = useAdmin();
  const router = useRouter();

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-detail-head">
          <div>
            <Link href="/admin/properties" className="admin-detail-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Siyahıya qayıt
            </Link>
            <h1>Yeni ev</h1>
          </div>
        </div>

        <AdminPropertyForm
          propertyId={null}
          onSaved={(result) => {
            if (result?.id) {
              router.push(`/admin/properties/${result.id}`);
              return;
            }
            router.push("/admin/properties");
          }}
          onCancel={() => router.push("/admin/properties")}
        />
      </div>
    </AdminShell>
  );
}
