import { notFound } from "next/navigation";
import { getDeliveryHouses, getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";
import { DeliveryPageClient } from "./DeliveryPageClient";
import "./delivery.css";

export const metadata = pageMetadata.delivery;

interface DeliveryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DeliveryPage({ searchParams }: DeliveryPageProps) {
  const config = await getSiteConfig();
  if (!config.modules.delivery) notFound();

  const params = await searchParams;
  const qRaw = params.q;
  const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
  const listing = await getDeliveryHouses({ q });

  return (
    <DeliveryPageClient items={listing.items} total={listing.total} q={q} />
  );
}
