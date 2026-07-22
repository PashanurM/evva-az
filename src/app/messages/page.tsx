import { MessagesPageClient } from "./MessagesPageClient";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.messages;

export default function MessagesPage() {
  return <MessagesPageClient />;
}
