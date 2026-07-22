import { FavoritesPageClient } from "./FavoritesPageClient";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.favorites;

export default function FavoritesPage() {
  return <FavoritesPageClient />;
}
