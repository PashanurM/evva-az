import { notFound } from "next/navigation";
import { getDeliveryHouses, getSiteConfig } from "@/lib/server-api";
import { createDynamicMetadata, KEYWORDS, pageMetadata } from "@/lib/site-metadata";
import { DeliveryDetailClient } from "./DeliveryDetailClient";
import "../delivery.css";

interface DeliveryHousePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DeliveryHousePageProps) {
  const config = await getSiteConfig();
  if (!config.modules.delivery) return pageMetadata.deliveryNotFound;

  const { id } = await params;
  const houseId = Number(id);
  if (!Number.isFinite(houseId) || houseId <= 0) return pageMetadata.deliveryNotFound;

  const listing = await getDeliveryHouses({});
  const house = listing.items.find((item) => item.id === houseId);
  if (!house) return pageMetadata.deliveryNotFound;

  return createDynamicMetadata({
    title: `${house.title} | EVVA Çatdırılma | EVVA.AZ`,
    description: `${house.address} ünvanına çatdırılma — EVVA Delivery xidməti.`,
    keywords: [...KEYWORDS.delivery, house.title, house.address],
  });
}

export default async function DeliveryHousePage({ params }: DeliveryHousePageProps) {
  const config = await getSiteConfig();
  if (!config.modules.delivery) notFound();

  const { id } = await params;
  const houseId = Number(id);
  if (!Number.isFinite(houseId) || houseId <= 0) notFound();

  const listing = await getDeliveryHouses({});
  const house = listing.items.find((item) => item.id === houseId);
  if (!house) notFound();

  return <DeliveryDetailClient house={house} />;
}
