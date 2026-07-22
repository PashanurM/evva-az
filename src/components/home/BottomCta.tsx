"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export function BottomCta() {
  const { t } = useLocale();

  return (
    <section className="bottom-cta">
      <div className="container bottom-cta-wrap">
        <div>
          <span className="section-kicker">{t("home.ctaKicker")}</span>
          <h2>{t("home.ctaTitle")}</h2>
          <p>{t("home.ctaText")}</p>
        </div>
        <Link href="#properties" className="bottom-whatsapp-btn">
          <Search size={18} /> {t("common.browseHomes")}
        </Link>
      </div>
    </section>
  );
}
