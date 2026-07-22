import { MyHousesClient } from "./MyHousesClient";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.myHouses;

export default function MyHousesPage() {
  return <MyHousesClient />;
}
