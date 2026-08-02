import { notFound } from "next/navigation";
import { getDeliveryHouse, getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";
import { DeliveryOrderClient } from "../DeliveryOrderClient";
import "../delivery.css";

interface DeliveryOrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: DeliveryOrderPageProps) {
  const { id } = await params;
  const houseId = Number(id);
  if (!Number.isFinite(houseId) || houseId <= 0) {
    return { title: "Delivery | EVVA.AZ" };
  }
  const house = await getDeliveryHouse(houseId);
  if (!house) return { title: "Delivery | EVVA.AZ" };
  return {
    ...pageMetadata.delivery,
    title: `${house.title} | EVVA Delivery`,
  };
}

export default async function DeliveryOrderPage({ params }: DeliveryOrderPageProps) {
  const config = await getSiteConfig();
  if (!config.modules.delivery) notFound();

  const { id } = await params;
  const houseId = Number(id);
  if (!Number.isFinite(houseId) || houseId <= 0) notFound();

  const house = await getDeliveryHouse(houseId);
  if (!house) notFound();

  return <DeliveryOrderClient house={house} />;
}
