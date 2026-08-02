import { mapApiProperty } from "@/lib/mappers";
import { getProperty } from "@/lib/server-api";
import { createPageMetadata } from "@/lib/site-metadata";
import { CompareClient } from "./CompareClient";

export const metadata = createPageMetadata({
  title: "Müqayisə | EVVA.AZ",
  description: "Seçdiyiniz evləri EVVA.AZ-da yan-yana müqayisə edin.",
});

interface ComparePageProps {
  searchParams: Promise<{ ids?: string }>;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const params = await searchParams;
  const ids = (params.ids || "")
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((id) => Number.isFinite(id) && id > 0)
    .slice(0, 3);

  const properties = (
    await Promise.all(ids.map((id) => getProperty(id)))
  )
    .filter((property): property is NonNullable<typeof property> => Boolean(property))
    .map(mapApiProperty);

  return <CompareClient properties={properties} />;
}
