import { OwnerPropertyEditClient } from "./OwnerPropertyEditClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OwnerPropertyEditPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  return <OwnerPropertyEditClient propertyId={Number.isFinite(propertyId) ? propertyId : 0} />;
}
