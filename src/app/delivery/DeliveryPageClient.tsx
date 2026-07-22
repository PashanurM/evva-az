"use client";

import Link from "next/link";
import { Bike, MapPin, Package, QrCode, Radio, ShoppingBag } from "lucide-react";
import type { DeliveryHouse } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

interface DeliveryPageClientProps {
  items: DeliveryHouse[];
  total: number;
  q?: string;
}

export function DeliveryPageClient({ items, total, q }: DeliveryPageClientProps) {
  const { t } = useLocale();

  return (
    <>
      <section className="page-hero delivery-hero">
        <div className="container">
          <div className="delivery-hero-panel">
            <span className="section-kicker delivery-kicker">{t("delivery.title")}</span>
            <h1>{t("delivery.heroTitle")}</h1>
            <p>{t("delivery.heroText")}</p>

            <div className="delivery-pills">
              <span className="delivery-pill">
                <QrCode size={14} aria-hidden />
                {t("delivery.pillQr")}
              </span>
              <span className="delivery-pill">
                <ShoppingBag size={14} aria-hidden />
                {t("delivery.pillPayment")}
              </span>
              <span className="delivery-pill">
                <Radio size={14} aria-hidden />
                {t("delivery.pillTracking")}
              </span>
            </div>

            <div className="delivery-search-card">
              <h2>{t("delivery.guestEntryTitle")}</h2>
              <p>{t("delivery.guestEntryText")}</p>
              <form className="delivery-search-form" method="get">
                <input
                  name="q"
                  defaultValue={q || ""}
                  placeholder={t("delivery.searchPlaceholderExtended")}
                />
                <button type="submit" className="search-btn" style={{ minHeight: 48 }}>
                  {t("delivery.searchButton")}
                </button>
                <Link href="/delivery" className="reset-search-btn" style={{ minHeight: 48 }}>
                  {t("common.reset")}
                </Link>
              </form>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "8px 0 24px" }}>
        <div className="container">
          <div className="section-intro-wrap" style={{ marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>{t("delivery.activeHomes")}</h2>
            <span className="discover-pill">{t("common.results", { count: total })}</span>
          </div>
        </div>
      </section>

      <section className="properties" style={{ paddingTop: 0 }}>
        <div className="container catalog-grid">
          {items.length === 0 ? (
            <div
              className="no-results"
              style={{ gridColumn: "1 / -1", textAlign: "center", padding: "60px 20px" }}
            >
              <Bike size={48} style={{ margin: "0 auto 16px", opacity: 0.5 }} />
              <p>{t("delivery.emptySearch")}</p>
            </div>
          ) : (
            items.map((house) => (
              <article key={house.id} className="catalog-card delivery-house-card">
                <div className="catalog-card-image delivery-house-image">
                  <Bike size={48} aria-hidden />
                </div>
                <div className="catalog-card-body">
                  <h2>{house.title}</h2>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      margin: 0,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MapPin size={14} aria-hidden />
                    {house.address || t("delivery.defaultLocation")}
                  </p>
                  <span className="delivery-fee-badge">
                    <Package size={14} aria-hidden />
                    {t("delivery.deliveryFee", { fee: house.delivery_fee })}
                  </span>
                  <Link href={`/delivery/${house.id}`} className="delivery-order-btn">
                    {t("delivery.orderToHome")}
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </>
  );
}
