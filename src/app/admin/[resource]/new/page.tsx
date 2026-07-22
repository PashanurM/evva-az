import { notFound } from "next/navigation";
import { AdminModuleCreatePage } from "@/components/admin/AdminModuleCreatePage";

export default async function AdminCreateRoute({
  params,
}: {
  params: Promise<{ resource: string }>;
}) {
  const { resource } = await params;
  if (resource !== "restaurants" && resource !== "places") {
    notFound();
  }

  return <AdminModuleCreatePage resource={resource} />;
}
