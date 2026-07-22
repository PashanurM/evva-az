"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminModuleForm } from "@/components/admin/AdminModuleForm";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminModuleCreatePage({
  resource,
}: {
  resource: "restaurants" | "places";
}) {
  const { admin, loading } = useAdmin();
  const router = useRouter();
  const back = resource === "restaurants" ? "/admin/restaurants" : "/admin/places";
  const title = resource === "restaurants" ? "Yeni restoran" : "Yeni məkan";

  if (loading) return <div className="admin-loading">Yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-detail-head">
          <div>
            <Link href={back} className="admin-detail-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Siyahıya qayıt
            </Link>
            <h1>{title}</h1>
          </div>
        </div>

        <AdminModuleForm
          resource={resource}
          onSaved={(id) => router.push(`/admin/${resource}/${id}`)}
          onCancel={() => router.push(back)}
        />
      </div>
    </AdminShell>
  );
}
