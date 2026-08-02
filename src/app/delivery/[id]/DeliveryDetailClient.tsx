"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Minus,
  MapPin,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DeliveryHouse, DeliveryProduct } from "@/lib/types";
import { useLocale } from "@/providers/LocaleProvider";

interface DeliveryDetailClientProps {
  house: DeliveryHouse;
}

type CartMap = Record<number, number>;

export function DeliveryDetailClient({ house }: DeliveryDetailClientProps) {
  const { t } = useLocale();
  const products = house.products || [];
  const categories = house.categories || [];
  const minOrder = Number(house.settings?.min_order_amount ?? 15);
  const freeThreshold = Number(house.settings?.free_delivery_threshold ?? 30);

  const [cart, setCart] = useState<CartMap>({});
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card_on_delivery">("cash");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successToken, setSuccessToken] = useState("");
  const [successCode, setSuccessCode] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");

  const productById = useMemo(() => {
    const map = new Map<number, DeliveryProduct>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  const cartLines = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qty]) => {
        const product = productById.get(Number(id));
        if (!product || qty <= 0) return null;
        return { product, qty, subtotal: product.price * qty };
      })
      .filter(Boolean) as Array<{ product: DeliveryProduct; qty: number; subtotal: number }>;
  }, [cart, productById]);

  const subtotal = cartLines.reduce((sum, line) => sum + line.subtotal, 0);
  const deliveryFee =
    freeThreshold > 0 && subtotal >= freeThreshold ? 0 : Number(house.delivery_fee || 0);
  const grandTotal = subtotal + deliveryFee;

  const visibleProducts =
    activeCategory === "all"
      ? products
      : products.filter((p) => p.category_id === activeCategory);

  function setQty(product: DeliveryProduct, next: number) {
    const capped = Math.max(0, Math.min(next, Math.max(0, product.available)));
    setCart((prev) => {
      const copy = { ...prev };
      if (capped <= 0) delete copy[product.id];
      else copy[product.id] = capped;
      return copy;
    });
  }

  async function placeOrder() {
    setError("");
    if (cartLines.length === 0) {
      setError(t("delivery.cartEmpty"));
      return;
    }
    if (minOrder > 0 && subtotal < minOrder) {
      setError(t("delivery.minOrderHint", { amount: minOrder }));
      return;
    }
    setBusy(true);
    const res = await api.createDeliveryOrder({
      house_id: house.id,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim(),
      note: note.trim(),
      payment_method: paymentMethod,
      items: cartLines.map((line) => ({
        product_id: line.product.id,
        quantity: line.qty,
      })),
    });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.error || t("delivery.orderFailed"));
      return;
    }
    setSuccessToken(res.data.tracking_token);
    setSuccessCode(res.data.order_code);
    setCart({});
  }

  if (successToken) {
    return (
      <section className="place-detail">
        <div className="container">
          <article className="delivery-detail-card delivery-success-card">
            <span className="section-kicker">{t("delivery.orderSuccess")}</span>
            <h1>{t("delivery.orderSuccess")}</h1>
            <p>{t("delivery.orderCode", { code: successCode })}</p>
            <div className="delivery-detail-actions">
              <Link
                href={`/delivery/track/${encodeURIComponent(successToken)}`}
                className="search-btn"
                style={{ minHeight: 48 }}
              >
                {t("delivery.trackOrder")}
              </Link>
              <Link href="/delivery" className="reset-search-btn" style={{ minHeight: 48 }}>
                {t("delivery.backToAllHomes")}
              </Link>
            </div>
          </article>
        </div>
      </section>
    );
  }

  return (
    <section className="place-detail delivery-order-page">
      <div className="container">
        <div className="delivery-detail-top">
          <Link href="/delivery" className="reset-search-btn" style={{ minHeight: 44 }}>
            <ArrowLeft size={16} aria-hidden />
            {t("delivery.backToAllHomes")}
          </Link>
          <span className="discover-pill">{t("delivery.title")}</span>
        </div>

        <article className="delivery-detail-card">
          <span className="section-kicker">{t("delivery.selectedHome")}</span>
          <h1 style={{ margin: "10px 0 16px", fontSize: "clamp(28px, 4vw, 40px)" }}>
            {house.title}
          </h1>
          <div className="delivery-pills" style={{ marginTop: 0 }}>
            <span
              className="delivery-pill"
              style={{
                background: "var(--bg-secondary)",
                color: "var(--text-primary)",
                borderColor: "var(--border-color)",
              }}
            >
              <MapPin size={14} aria-hidden />
              {house.address || t("delivery.defaultLocation")}
            </span>
            <span className="delivery-fee-badge">
              <Package size={14} aria-hidden />
              {t("delivery.deliveryFee", { fee: house.delivery_fee })}
            </span>
          </div>
          {house.settings?.service_area_text ? (
            <p style={{ color: "var(--text-secondary)", marginTop: 14, lineHeight: 1.6 }}>
              {house.settings.service_area_text}
            </p>
          ) : null}
        </article>

        <div className="delivery-order-layout">
          <div className="delivery-catalog">
            <div className="hub-section-head" style={{ marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0 }}>{t("delivery.catalogTitle")}</h2>
                {minOrder > 0 ? (
                  <p style={{ margin: "6px 0 0", color: "var(--text-muted)", fontSize: 13 }}>
                    {t("delivery.minOrderHint", { amount: minOrder })}
                  </p>
                ) : null}
              </div>
            </div>

            {categories.length > 0 ? (
              <div className="rmenu-nav" style={{ position: "static" }}>
                <button
                  type="button"
                  className={`rmenu-nav-chip${activeCategory === "all" ? " is-active" : ""}`}
                  onClick={() => setActiveCategory("all")}
                >
                  {t("delivery.allCategories")}
                </button>
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`rmenu-nav-chip${activeCategory === category.id ? " is-active" : ""}`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="delivery-product-grid">
              {visibleProducts.length === 0 ? (
                <p className="hub-empty">{t("delivery.empty")}</p>
              ) : (
                visibleProducts.map((product) => {
                  const qty = cart[product.id] || 0;
                  const disabled = product.available <= 0;
                  return (
                    <article key={product.id} className="delivery-product-card">
                      <div className="delivery-product-copy">
                        <strong>{product.name}</strong>
                        {product.description ? <p>{product.description}</p> : null}
                        <div className="delivery-product-meta">
                          <em>{product.price.toFixed(2)} ₼ / {product.unit}</em>
                          <span>{t("delivery.stockLeft", { count: product.available })}</span>
                        </div>
                      </div>
                      <div className="delivery-product-actions">
                        {qty > 0 ? (
                          <div className="delivery-qty">
                            <button type="button" onClick={() => setQty(product, qty - 1)} aria-label="-">
                              <Minus size={14} />
                            </button>
                            <span>{qty}</span>
                            <button
                              type="button"
                              disabled={disabled || qty >= product.available}
                              onClick={() => setQty(product, qty + 1)}
                              aria-label="+"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="search-btn"
                            style={{ minHeight: 40 }}
                            disabled={disabled}
                            onClick={() => setQty(product, 1)}
                          >
                            <ShoppingBag size={14} /> {t("delivery.addToCart")}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>

          <aside className="delivery-cart-panel">
            <h2>
              <ShoppingBag size={18} aria-hidden /> {t("delivery.cartTitle")}
            </h2>
            {cartLines.length === 0 ? (
              <p className="hub-empty">{t("delivery.cartEmpty")}</p>
            ) : (
              <ul className="delivery-cart-lines">
                {cartLines.map((line) => (
                  <li key={line.product.id}>
                    <span>
                      {line.product.name} × {line.qty}
                    </span>
                    <strong>{line.subtotal.toFixed(2)} ₼</strong>
                  </li>
                ))}
              </ul>
            )}

            <dl className="delivery-cart-totals">
              <div>
                <dt>{t("delivery.subtotal")}</dt>
                <dd>{subtotal.toFixed(2)} ₼</dd>
              </div>
              <div>
                <dt>{t("delivery.feeLabel")}</dt>
                <dd>{deliveryFee.toFixed(2)} ₼</dd>
              </div>
              <div className="is-total">
                <dt>{t("delivery.total")}</dt>
                <dd>{grandTotal.toFixed(2)} ₼</dd>
              </div>
            </dl>

            <label className="delivery-field">
              {t("delivery.guestName")}
              <input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                autoComplete="name"
              />
            </label>
            <label className="delivery-field">
              {t("delivery.guestPhone")}
              <input
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                autoComplete="tel"
                placeholder="+994..."
              />
            </label>
            <label className="delivery-field">
              {t("delivery.orderNote")}
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("delivery.orderNotePlaceholder")}
              />
            </label>

            <div className="delivery-payment-options">
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />
                {t("delivery.paymentCash")}
              </label>
              <label>
                <input
                  type="radio"
                  name="pay"
                  checked={paymentMethod === "card_on_delivery"}
                  onChange={() => setPaymentMethod("card_on_delivery")}
                />
                {t("delivery.paymentCard")}
              </label>
            </div>

            {error ? <p className="delivery-order-error">{error}</p> : null}

            <button
              type="button"
              className="search-btn"
              style={{ minHeight: 48, width: "100%" }}
              disabled={busy}
              onClick={() => void placeOrder()}
            >
              {busy ? t("common.wait") : t("delivery.placeOrder")}
            </button>

            {house.property_id > 0 ? (
              <Link
                href={`/property/${house.property_id}`}
                className="reset-search-btn"
                style={{ minHeight: 44, width: "100%", justifyContent: "center" }}
              >
                {t("common.viewHome")}
              </Link>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
