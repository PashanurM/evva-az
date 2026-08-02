"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Package } from "lucide-react";
import { api } from "@/lib/api";
import type { DeliveryTrackedOrder } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

export function DeliveryTrackClient({ token }: { token: string }) {
  const { t } = useLocale();
  const [order, setOrder] = useState<DeliveryTrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void api.trackDeliveryOrder(token).then((res) => {
      if (!active) return;
      setLoading(false);
      if (!res.success || !res.data) {
        setError(res.error || t("delivery.orderFailed"));
        return;
      }
      setOrder(res.data);
    });
    return () => {
      active = false;
    };
  }, [token, t]);

  return (
    <section className="place-detail">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="delivery-detail-top">
          <Link href="/delivery" className="reset-search-btn" style={{ minHeight: 44 }}>
            <ArrowLeft size={16} aria-hidden />
            {t("delivery.backToAllHomes")}
          </Link>
          <span className="discover-pill">{t("delivery.trackTitle")}</span>
        </div>

        <article className="delivery-detail-card">
          {loading ? (
            <p>{t("common.loading")}</p>
          ) : error || !order ? (
            <p className="delivery-order-error">{error || t("delivery.orderFailed")}</p>
          ) : (
            <>
              <span className="section-kicker">
                <Package size={14} aria-hidden /> {order.status}
              </span>
              <h1 style={{ margin: "10px 0 8px" }}>
                {t("delivery.orderCode", { code: order.order_code })}
              </h1>
              <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>
                {order.house.title}
                {order.house.address ? ` · ${order.house.address}` : ""}
              </p>

              <ul className="delivery-cart-lines" style={{ marginTop: 20 }}>
                {order.items.map((item) => (
                  <li key={`${item.product_id}-${item.product_name}`}>
                    <span>
                      {item.product_name} × {item.quantity}
                    </span>
                    <strong>{item.subtotal.toFixed(2)} ₼</strong>
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
                <div className="is-total">
                  <dt>{t("delivery.total")}</dt>
                  <dd>{order.grand_total.toFixed(2)} ₼</dd>
                </div>
              </dl>

              {order.history.length > 0 ? (
                <div style={{ marginTop: 20 }}>
                  <h3 style={{ margin: "0 0 10px" }}>{t("delivery.trackTitle")}</h3>
                  <ul className="delivery-history">
                    {order.history.map((row, index) => (
                      <li key={`${row.created_at}-${index}`}>
                        <strong>{row.new_status}</strong>
                        {row.note ? <span> — {row.note}</span> : null}
                        <em>{row.created_at}</em>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </article>
      </div>
    </section>
  );
}
