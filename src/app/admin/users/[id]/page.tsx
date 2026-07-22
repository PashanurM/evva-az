import { AdminEntityDetailPage } from "@/components/admin/AdminEntityDetailPage";
import { notFound } from "next/navigation";

export default async function AdminUserDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <AdminEntityDetailPage resource="users" id={id} />;
}
