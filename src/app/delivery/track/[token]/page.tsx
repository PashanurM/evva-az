import { notFound } from "next/navigation";
import { getSiteConfig } from "@/lib/server-api";
import { pageMetadata } from "@/lib/site-metadata";
import { DeliveryTrackClient } from "./DeliveryTrackClient";
import "../../delivery.css";

export const metadata = pageMetadata.delivery;

interface TrackPageProps {
  params: Promise<{ token: string }>;
}

export default async function DeliveryTrackPage({ params }: TrackPageProps) {
  const config = await getSiteConfig();
  if (!config.modules.delivery) notFound();

  const { token } = await params;
  const clean = decodeURIComponent(token || "").trim();
  if (!clean) notFound();

  return <DeliveryTrackClient token={clean} />;
}
