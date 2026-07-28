import { OwnerReservationsClient } from "./OwnerReservationsClient";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = {
  ...pageMetadata.myHouses,
  title: "Rezervasiyalarım | EVVA.AZ",
};

export default function OwnerReservationsPage() {
  return <OwnerReservationsClient />;
}
