"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Home, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import type { MyDeliveryHouse } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

export function DeliveryMyBookingSection() {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<MyDeliveryHouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (authLoading || !user) {
      setItems([]);
      setLoaded(false);
      return;
    }

    let active = true;
    setLoading(true);
    void api.getMyDeliveryHouses().then((res) => {
      if (!active) return;
      setItems(res.success && res.data ? res.data.items : []);
      setLoading(false);
      setLoaded(true);
    });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  if (authLoading || !user) return null;

  return (
    <section className="delivery-my-booking">
      <div className="container">
        <div className="delivery-my-booking-card glass">
          <div className="delivery-my-booking-head">
            <span className="section-kicker">{t("delivery.myBookingKicker")}</span>
            <h2>{t("delivery.myBookingTitle")}</h2>
            <p>{t("delivery.myBookingText")}</p>
          </div>

          {loading ? (
            <p>{t("common.loading")}</p>
          ) : loaded && items.length === 0 ? (
            <p className="delivery-my-booking-empty">{t("delivery.myBookingEmpty")}</p>
          ) : (
            <div className="delivery-my-booking-grid">
              {items.map((house) => (
                <article key={house.id} className="delivery-my-booking-item">
                  <div>
                    <h3>
                      <Home size={16} aria-hidden /> {house.title}
                    </h3>
                    <p>
                      <MapPin size={14} aria-hidden />
                      {house.address || t("delivery.defaultLocation")}
                    </p>
                    {house.booking?.check_in ? (
                      <span className="delivery-my-booking-dates">
                        <CalendarCheck size={14} aria-hidden />
                        {house.booking.check_in} - {house.booking.check_out}
                      </span>
                    ) : null}
                  </div>
                  <Link href={`/delivery/${house.id}`} className="delivery-order-btn">
                    {t("delivery.orderToHome")}
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
