"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bike,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { toast } from "react-toastify";
import { AuthRequiredGate } from "@/components/auth/AuthRequiredGate";
import { api } from "@/lib/api";
import type { DeliveryHouse, DeliveryProduct } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

type CartLine = { product: DeliveryProduct; quantity: number };

interface DeliveryOrderClientProps {
  house: DeliveryHouse;
}

const DEFAULT_MIN_ORDER = 20;
const DEFAULT_FREE_DELIVERY = 50;

function formatMoney(value: number): string {
  return value.toFixed(2);
}

export function DeliveryOrderClient({ house }: DeliveryOrderClientProps) {
  const { t } = useLocale();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<number | "all">("all");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card_on_delivery">("cash");
  const [busy, setBusy] = useState(false);
  const [showLoginGate, setShowLoginGate] = useState(false);

  useEffect(() => {
    if (!user) return;
    setGuestName((current) => current || user.full_name || "");
    setGuestPhone((current) => current || user.phone || "");
  }, [user]);

  const minOrder = house.settings?.min_order_amount ?? DEFAULT_MIN_ORDER;
  const freeThreshold = house.settings?.free_delivery_threshold ?? DEFAULT_FREE_DELIVERY;

  const products = house.products || [];
  const categories = house.categories || [];

  const filteredProducts = useMemo(() => {
    if (categoryId === "all") return products;
    return products.filter((item) => item.category_id === categoryId);
  }, [products, categoryId]);

  const cartLines = Object.values(cart);
  const subtotal = cartLines.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const deliveryFee =
    freeThreshold > 0 && subtotal >= freeThreshold ? 0 : house.delivery_fee;
  const grandTotal = subtotal + deliveryFee;

  const minProgress = minOrder > 0 ? Math.min(100, (subtotal / minOrder) * 100) : 100;
  const freeProgress =
    freeThreshold > 0 ? Math.min(100, (subtotal / freeThreshold) * 100) : 100;

  function addToCart(product: DeliveryProduct) {
    if (product.available <= 0) return;
    setCart((current) => {
      const existing = current[product.id];
      const nextQty = (existing?.quantity || 0) + 1;
      if (nextQty > product.available) return current;
      return {
        ...current,
        [product.id]: { product, quantity: nextQty },
      };
    });
  }

  function changeQty(productId: number, delta: number) {
    setCart((current) => {
      const line = current[productId];
      if (!line) return current;
      const nextQty = line.quantity + delta;
      if (nextQty <= 0) {
        const next = { ...current };
        delete next[productId];
        return next;
      }
      if (nextQty > line.product.available) return current;
      return {
        ...current,
        [productId]: { ...line, quantity: nextQty },
      };
    });
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!user) {
      setShowLoginGate(true);
      return;
    }
    if (cartLines.length === 0) {
      toast.warning(t("delivery.cartEmpty"));
      return;
    }
    if (minOrder > 0 && subtotal < minOrder) {
      toast.warning(t("delivery.minOrderHint", { amount: formatMoney(minOrder) }));
      return;
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      toast.warning(t("delivery.guestName") + " / " + t("delivery.guestPhone"));
      return;
    }

    setBusy(true);
    const res = await api.createDeliveryOrder({
      house_id: house.id,
      guest_name: guestName.trim(),
      guest_phone: guestPhone.trim(),
      note: note.trim() || undefined,
      payment_method: paymentMethod,
      items: cartLines.map((line) => ({
        product_id: line.product.id,
        quantity: line.quantity,
      })),
    });
    setBusy(false);

    if (res.success && res.data?.tracking_token) {
      toast.success(t("delivery.orderSuccess"));
      router.push(`/delivery/track/${encodeURIComponent(res.data.tracking_token)}`);
      return;
    }
    toast.error(res.error || t("delivery.orderFailed"));
  }

  if (showLoginGate && !user && !authLoading) {
    return (
      <AuthRequiredGate
        kicker={t("delivery.kicker")}
        title={t("delivery.loginRequiredTitle")}
        description={t("delivery.loginRequiredText")}
        propertyTitle={house.title}
        loginHref={`/login?return=${encodeURIComponent(`/delivery/${house.id}`)}`}
        registerHref={`/register?return=${encodeURIComponent(`/delivery/${house.id}`)}`}
        backHref="/delivery"
        backLabel={t("delivery.backToAllHomes")}
      />
    );
  }

  return (
    <>
      <section className="page-hero delivery-hero delivery-order-hero">
        <div className="container">
          <Link href="/delivery" className="delivery-back-link">
            <ArrowLeft size={16} aria-hidden />
            {t("delivery.backToAllHomes")}
          </Link>
          <div className="delivery-order-head">
            <span className="section-kicker delivery-kicker">{t("delivery.kicker")}</span>
            <h1>{house.title}</h1>
            <p className="delivery-order-address">
              <MapPin size={15} aria-hidden />
              {house.address || t("delivery.defaultLocation")}
            </p>
            <span className="delivery-fee-badge">
              <Package size={14} aria-hidden />
              {t("delivery.deliveryFee", { fee: house.delivery_fee })}
            </span>
          </div>
        </div>
      </section>

      <section className="delivery-order-shell">
        <div className="container delivery-order-grid">
          <div className="delivery-catalog">
            <div className="delivery-catalog-head">
              <h2>{t("delivery.catalogTitle")}</h2>
              {categories.length > 0 ? (
                <div className="delivery-category-tabs">
                  <button
                    type="button"
                    className={categoryId === "all" ? "is-active" : ""}
                    onClick={() => setCategoryId("all")}
                  >
                    {t("delivery.allCategories")}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={categoryId === cat.id ? "is-active" : ""}
                      onClick={() => setCategoryId(cat.id)}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="delivery-catalog-empty">
                <Bike size={40} aria-hidden />
                <p>{t("delivery.catalogEmpty")}</p>
              </div>
            ) : (
              <div className="delivery-product-grid">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="delivery-product-card">
                    <div className="delivery-product-image">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={120}
                          height={90}
                          unoptimized
                        />
                      ) : (
                        <ShoppingBag size={28} aria-hidden />
                      )}
                    </div>
                    <div className="delivery-product-body">
                      <h3>{product.name}</h3>
                      <p>{product.description}</p>
                      <div className="delivery-product-meta">
                        <strong>{formatMoney(product.price)} ₼</strong>
                        <span>{t("delivery.stockLeft", { count: product.available })}</span>
                      </div>
                      <button
                        type="button"
                        className="delivery-add-btn"
                        disabled={product.available <= 0}
                        onClick={() => addToCart(product)}
                      >
                        {t("delivery.addToCart")}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="delivery-cart-panel glass">
            <h2>{t("delivery.cartTitle")}</h2>

            <div className="delivery-progress-block">
              <div className="delivery-progress-row">
                <span>{t("delivery.minOrderProgress", { amount: formatMoney(minOrder) })}</span>
                <strong>{Math.round(minProgress)}%</strong>
              </div>
              <div className="delivery-progress-bar">
                <span style={{ width: `${minProgress}%` }} />
              </div>
            </div>

            <div className="delivery-progress-block">
              <div className="delivery-progress-row">
                <span>
                  {t("delivery.freeDeliveryProgress", { amount: formatMoney(freeThreshold) })}
                </span>
                <strong>{Math.round(freeProgress)}%</strong>
              </div>
              <div className="delivery-progress-bar delivery-progress-bar--free">
                <span style={{ width: `${freeProgress}%` }} />
              </div>
            </div>

            {cartLines.length === 0 ? (
              <p className="delivery-cart-empty">{t("delivery.cartEmpty")}</p>
            ) : (
              <ul className="delivery-cart-lines">
                {cartLines.map((line) => (
                  <li key={line.product.id}>
                    <div>
                      <strong>{line.product.name}</strong>
                      <span>
                        {formatMoney(line.product.price)} ₼ x {line.quantity}
                      </span>
                    </div>
                    <div className="delivery-qty-controls">
                      <button
                        type="button"
                        aria-label="-"
                        onClick={() => changeQty(line.product.id, -1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label="+"
                        onClick={() => changeQty(line.product.id, 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <dl className="delivery-cart-totals">
              <div>
                <dt>{t("delivery.subtotal")}</dt>
                <dd>{formatMoney(subtotal)} ₼</dd>
              </div>
              <div>
                <dt>{t("delivery.feeLabel")}</dt>
                <dd>{formatMoney(deliveryFee)} ₼</dd>
              </div>
              <div className="delivery-cart-total-row">
                <dt>{t("delivery.total")}</dt>
                <dd>{formatMoney(grandTotal)} ₼</dd>
              </div>
            </dl>

            <form className="delivery-checkout-form" onSubmit={(e) => void submitOrder(e)}>
              <label>
                {t("delivery.guestName")}
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={user?.full_name || ""}
                />
              </label>
              <label>
                {t("delivery.guestPhone")}
                <input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder={user?.phone || ""}
                />
              </label>
              <label>
                {t("delivery.orderNote")}
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("delivery.orderNotePlaceholder")}
                  rows={3}
                />
              </label>
              <fieldset className="delivery-payment-fieldset">
                <legend>{t("delivery.paymentLabel")}</legend>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                  />
                  {t("delivery.paymentCash")}
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card_on_delivery"}
                    onChange={() => setPaymentMethod("card_on_delivery")}
                  />
                  {t("delivery.paymentCard")}
                </label>
              </fieldset>

              {!user && !authLoading ? (
                <p className="delivery-login-hint">{t("delivery.loginToOrderHint")}</p>
              ) : null}

              <button
                type="submit"
                className="delivery-checkout-btn"
                disabled={busy || cartLines.length === 0}
              >
                {user ? t("delivery.placeOrder") : t("delivery.loginToOrder")}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </>
  );
}
