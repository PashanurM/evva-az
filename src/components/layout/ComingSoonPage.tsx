"use client";

import Link from "next/link";
import { ModuleShell } from "@/components/layout/ModuleShell";
import { useLocale } from "@/providers/LocaleProvider";

type ComingSoonVariant = "myBookings" | "myHouses";

interface ComingSoonPageProps {
  variant: ComingSoonVariant;
  icon?: string;
}

export function ComingSoonPage({
  variant,
  icon = "fa-screwdriver-wrench",
}: ComingSoonPageProps) {
  const { t } = useLocale();

  const title =
    variant === "myBookings"
      ? t("comingSoon.myBookingsTitle")
      : t("comingSoon.myHousesTitle");
  const description =
    variant === "myBookings"
      ? t("comingSoon.myBookingsDesc")
      : t("comingSoon.myHousesDesc");

  return (
    <ModuleShell title={title}>
      <div className="module-coming-soon">
        <i className={`fas ${icon}`} style={{ fontSize: 42, marginBottom: 16 }} />
        <h2>{title}</h2>
        <p>{description}</p>
        <Link href="/" className="auth-btn primary" style={{ marginTop: 20, display: "inline-flex" }}>
          {t("common.backToHome")}
        </Link>
      </div>
    </ModuleShell>
  );
}
