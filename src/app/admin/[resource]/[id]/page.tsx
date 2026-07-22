import { notFound } from "next/navigation";
import { AdminEntityDetailPage } from "@/components/admin/AdminEntityDetailPage";
import type { AdminDetailResource } from "@/lib/admin-api";

const RESOURCES: AdminDetailResource[] = [
  "properties",
  "reservations",
  "restaurants",
  "places",
  "payments",
  "users",
  "messages",
];

export default async function AdminDetailRoute({
  params,
}: {
  params: Promise<{ resource: string; id: string }>;
}) {
  const { resource, id: rawId } = await params;
  const id = Number(rawId);
  if (!RESOURCES.includes(resource as AdminDetailResource) || !Number.isInteger(id) || id <= 0) {
    notFound();
  }

  return <AdminEntityDetailPage resource={resource as AdminDetailResource} id={id} />;
}
