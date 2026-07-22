import { ComingSoonPage } from "@/components/layout/ComingSoonPage";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata.myBookings;

export default function MyBookingsPage() {
  return <ComingSoonPage variant="myBookings" icon="fa-calendar-check" />;
}
