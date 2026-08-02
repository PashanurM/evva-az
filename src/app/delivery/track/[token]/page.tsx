import { getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";
import { notFound } from "next/navigation";
import { DeliveryTrackClient } from "./DeliveryTrackClient";
import "../../delivery.css";

interface DeliveryTrackPageProps {
  params: Promise<{ token: string }>;
}

export const metadata = {
  ...pageMetadata.delivery,
  title: "Sifariş izləmə | EVVA Delivery",
};

export default async function DeliveryTrackPage({ params }: DeliveryTrackPageProps) {
  const config = await getSiteConfig();
  if (!config.modules.delivery) notFound();

  const { token } = await params;
  const trimmed = token.trim();
  if (!trimmed) notFound();

  return <DeliveryTrackClient token={trimmed} />;
}
