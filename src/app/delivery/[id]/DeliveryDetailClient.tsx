"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Package } from "lucide-react";
import type { DeliveryHouse } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

interface DeliveryDetailClientProps {
  house: DeliveryHouse;
}

export function DeliveryDetailClient({ house }: DeliveryDetailClientProps) {
  const { t } = useLocale();

  return (
    <section className="place-detail">
      <div className="container">
        <div className="delivery-detail-top">
          <Link href="/delivery" className="reset-search-btn" style={{ minHeight: 44 }}>
            <ArrowLeft size={16} aria-hidden />
            {t("delivery.backToAllHomes")}
          </Link>
          <span className="discover-pill">{t("delivery.title")}</span>
        </div>

        <article className="delivery-detail-card">
          <div>
            <span className="section-kicker">{t("delivery.selectedHome")}</span>
            <h1 style={{ margin: "10px 0 16px", fontSize: "clamp(28px, 4vw, 40px)" }}>
              {house.title}
            </h1>
            <div className="delivery-pills" style={{ marginTop: 0 }}>
              <span className="delivery-pill" style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", borderColor: "var(--border-color)" }}>
                <MapPin size={14} aria-hidden />
                {house.address || t("delivery.defaultLocation")}
              </span>
              <span className="delivery-fee-badge">
                <Package size={14} aria-hidden />
                {t("delivery.deliveryFee", { fee: house.delivery_fee })}
              </span>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.75, marginTop: 20 }}>
              {t("delivery.comingSoon")}
            </p>
            <div className="delivery-detail-actions">
              {house.property_id > 0 && (
                <Link href={`/property/${house.property_id}`} className="search-btn" style={{ minHeight: 48 }}>
                  {t("common.viewHome")}
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
