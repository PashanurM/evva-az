import { notFound } from "next/navigation";
import { getProperty } from "@/lib/server-api";
import { mapApiProperty } from "@/lib/mappers";
import { pageMetadata } from "@/lib/site-metadata";
import { BookingPageClient } from "./BookingPageClient";

interface PageProps {
  searchParams: Promise<{ property_id?: string }>;
}

export const metadata = pageMetadata.booking;

export default async function BookingPage({ searchParams }: PageProps) {
  const { property_id } = await searchParams;
  const apiProperty = property_id ? await getProperty(Number(property_id)) : null;
  const property = apiProperty ? mapApiProperty(apiProperty) : null;

  if (property_id && !property) notFound();

  return <BookingPageClient property={property} />;
}
