import { Suspense } from "react";
import { OwnerWalletClient } from "./OwnerWalletClient";

export const metadata = {
  title: "Balans / Premium | EVVA.AZ",
};

export default function OwnerWalletPage() {
  return (
    <Suspense fallback={<p className="owner-panel-empty">Yüklənir...</p>}>
      <OwnerWalletClient />
    </Suspense>
  );
}
