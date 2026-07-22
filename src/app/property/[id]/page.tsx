import { notFound } from "next/navigation";
import { mapApiProperty } from "@/lib/mappers";
import { getProperty } from "@/lib/server-api";
import { createDynamicMetadata, KEYWORDS, pageMetadata } from "@/lib/site-metadata";
import { PropertyDetailClient } from "./PropertyDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const apiProperty = await getProperty(Number(id));
  if (!apiProperty) return pageMetadata.propertyNotFound;
  return createDynamicMetadata({
    title: `${apiProperty.title} | ${apiProperty.location} günlük kirayə | EVVA.AZ`,
    description: apiProperty.description,
    keywords: [
      ...KEYWORDS.property,
      apiProperty.location,
      apiProperty.title,
      ...(apiProperty.tags ?? []),
    ],
  });
}

function buildJune2026Calendar() {
  const daysInMonth = 30;
  const startDay = 0;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default async function PropertyPage({ params }: PageProps) {
  const { id } = await params;
  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) notFound();

  const apiProperty = await getProperty(propertyId);
  if (!apiProperty) notFound();

  const property = mapApiProperty(apiProperty);
  const calendarDays = buildJune2026Calendar();
  const mapsUrl =
    property.lat && property.lng
      ? `https://www.google.com/maps/search/?api=1&query=${property.lat},${property.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(property.location)}`;

  const gallery: string[] = [];
  const pushUnique = (url?: string) => {
    if (!url) return;
    if (gallery.includes(url)) return;
    gallery.push(url);
  };
  pushUnique(property.image);
  for (const image of property.images || []) {
    pushUnique(image);
  }

  return (
    <PropertyDetailClient
      property={property}
      calendarDays={calendarDays}
      mapsUrl={mapsUrl}
      gallery={gallery}
    />
  );
}
