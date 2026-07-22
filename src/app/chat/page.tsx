import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProperty } from "@/lib/server-api";
import { mapApiProperty } from "@/lib/mappers";
import { pageMetadata } from "@/lib/site-metadata";
import { ChatPageClient } from "./ChatPageClient";

interface PageProps {
  searchParams: Promise<{ property_id?: string; conversation_id?: string }>;
}

export const metadata = pageMetadata.chat;

export default async function ChatPage({ searchParams }: PageProps) {
  const { property_id } = await searchParams;
  const apiProperty = property_id ? await getProperty(Number(property_id)) : null;
  const property = apiProperty ? mapApiProperty(apiProperty) : null;

  if (property_id && !property) notFound();

  return (
    <Suspense fallback={<div className="auth-shell"><div className="auth-card"><p>…</p></div></div>}>
      <ChatPageClient property={property} />
    </Suspense>
  );
}
