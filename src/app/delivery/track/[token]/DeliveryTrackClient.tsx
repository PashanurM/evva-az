"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Package, Radio } from "lucide-react";
import { api } from "@/lib/api";
import type { DeliveryTrackedOrder } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

const STATUS_STEPS = [
  "new",
  "sent_to_warehouse",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function DeliveryTrackClient({ token }: { token: string }) {
  const { t } = useLocale();
  const [order, setOrder] = useState<DeliveryTrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void api.trackDeliveryOrder(token).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setOrder(res.data);
      } else {
        setError(res.error || t("delivery.trackNotFound"));
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [token, t]);

  const statusIndex = order ? STATUS_STEPS.indexOf(order.status) : -1;

  return (
    <section className="delivery-track-shell">
      <div className="container">
        <Link href="/delivery" className="delivery-back-link">
          <ArrowLeft size={16} aria-hidden />
          {t("delivery.backToAllHomes")}
        </Link>

        <div className="delivery-track-head glass">
          <span className="section-kicker">
            <Radio size={14} aria-hidden /> {t("delivery.trackTitle")}
          </span>
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : error ? (
            <>
              <h1>{t("delivery.trackNotFound")}</h1>
              <p>{error}</p>
            </>
          ) : order ? (
            <>
              <h1>{t("delivery.orderCode", { code: order.order_code })}</h1>
              <p>
                {order.house.title} · {order.house.address}
              </p>
              <div className="delivery-track-status-pill">{order.status}</div>
            </>
          ) : null}
        </div>

        {order ? (
          <>
            <div className="delivery-track-progress glass">
              {STATUS_STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`delivery-track-step${statusIndex >= index ? " is-done" : ""}${
                    order.status === step ? " is-current" : ""
                  }`}
                >
                  <span>{index + 1}</span>
                  <small>{step.replace(/_/g, " ")}</small>
                </div>
              ))}
            </div>

            <div className="delivery-track-grid">
              <section className="glass delivery-track-card">
                <h2>{t("delivery.cartTitle")}</h2>
                <ul className="delivery-track-items">
                  {order.items.map((item) => (
                    <li key={`${item.product_id}-${item.quantity}`}>
                      <strong>{item.product_name}</strong>
                      <span>
                        {item.quantity} x {item.unit_price.toFixed(2)} ₼
                      </span>
                    </li>
                  ))}
                </ul>
                <dl className="delivery-cart-totals">
                  <div>
                    <dt>{t("delivery.subtotal")}</dt>
                    <dd>{order.total_amount.toFixed(2)} ₼</dd>
                  </div>
                  <div>
                    <dt>{t("delivery.feeLabel")}</dt>
                    <dd>{order.delivery_fee.toFixed(2)} ₼</dd>
                  </div>
                  <div className="delivery-cart-total-row">
                    <dt>{t("delivery.total")}</dt>
                    <dd>{order.grand_total.toFixed(2)} ₼</dd>
                  </div>
                </dl>
              </section>

              <section className="glass delivery-track-card">
                <h2>
                  <Package size={18} aria-hidden /> {t("delivery.trackHistory")}
                </h2>
                <ul className="delivery-track-history">
                  {order.history.length === 0 ? (
                    <li>{t("delivery.trackHistoryEmpty")}</li>
                  ) : (
                    order.history.map((entry, index) => (
                      <li key={`${entry.created_at}-${index}`}>
                        <strong>{entry.new_status}</strong>
                        {entry.note ? <p>{entry.note}</p> : null}
                        <time>{entry.created_at}</time>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
