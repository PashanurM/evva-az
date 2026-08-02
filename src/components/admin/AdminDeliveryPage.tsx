"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Package, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import {
  adminApi,
  type AdminDeliveryHouse,
  type AdminDeliveryProduct,
} from "@/lib/admin-api";
import { api } from "@/lib/api";
import type { DeliveryCategory } from "@/lib/types";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdmin } from "@/providers/AdminProvider";

type TabKey = "houses" | "products";

export function AdminDeliveryPage() {
  const { admin, loading } = useAdmin();
  const [tab, setTab] = useState<TabKey>("houses");
  const [items, setItems] = useState<AdminDeliveryHouse[]>([]);
  const [products, setProducts] = useState<AdminDeliveryProduct[]>([]);
  const [categories, setCategories] = useState<DeliveryCategory[]>([]);
  const [moduleActive, setModuleActive] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [feeDrafts, setFeeDrafts] = useState<Record<number, string>>({});
  const [stockDrafts, setStockDrafts] = useState<Record<number, string>>({});
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    category_id: "",
    stock: "",
  });

  const loadHouses = useCallback(async () => {
    setPageLoading(true);
    setError("");
    const res = await adminApi.getDeliveryHousesAdmin();
    if (res.success && res.data) {
      setItems(res.data.items);
      setModuleActive(res.data.module_active);
      setActiveCount(res.data.active_count);
      const fees: Record<number, string> = {};
      res.data.items.forEach((house) => {
        fees[house.id] = String(house.delivery_fee ?? 0);
      });
      setFeeDrafts(fees);

      const firstActive = res.data.items.find((house) => house.is_active) || res.data.items[0];
      if (firstActive) {
        const houseRes = await api.getDeliveryHouse(firstActive.id);
        if (houseRes.success && houseRes.data?.categories) {
          setCategories(houseRes.data.categories);
        }
      }
    } else {
      setError(res.error || "Delivery evləri yüklənmədi");
    }
    setPageLoading(false);
  }, []);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    const res = await adminApi.getDeliveryProductsAdmin();
    if (res.success && res.data) {
      setProducts(res.data.items);
      const stocks: Record<number, string> = {};
      res.data.items.forEach((product) => {
        stocks[product.id] = String(product.quantity ?? 0);
      });
      setStockDrafts(stocks);
    } else {
      toast.error(res.error || "Məhsullar yüklənmədi");
    }
    setProductsLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    void loadHouses();
  }, [admin, loadHouses]);

  useEffect(() => {
    if (!admin || tab !== "products") return;
    void loadProducts();
  }, [admin, tab, loadProducts]);

  async function toggleModule() {
    setBusy(-1);
    const res = await adminApi.patchModule("delivery", !moduleActive);
    if (res.success) {
      toast.success("Delivery modulu yeniləndi");
      await loadHouses();
    } else {
      toast.error(res.error || "Modul yenilənmədi");
    }
    setBusy(null);
  }

  async function toggleActive(house: AdminDeliveryHouse, value: boolean) {
    setBusy(house.id);
    setItems((current) =>
      current.map((row) => (row.id === house.id ? { ...row, is_active: value } : row)),
    );
    setActiveCount((count) => count + (value ? 1 : -1));
    const res = await adminApi.patchDeliveryHouse(house.id, { is_active: value });
    if (res.success && res.data) {
      toast.success(value ? "Delivery aktiv edildi" : "Delivery deaktiv edildi");
      setItems((current) =>
        current.map((row) => (row.id === house.id ? res.data!.house : row)),
      );
    } else {
      setItems((current) =>
        current.map((row) => (row.id === house.id ? { ...row, is_active: !value } : row)),
      );
      setActiveCount((count) => count + (value ? -1 : 1));
      toast.error(res.error || "Yenilənmədi");
    }
    setBusy(null);
  }

  async function saveFee(house: AdminDeliveryHouse) {
    const fee = Number(feeDrafts[house.id] ?? house.delivery_fee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.warning("Çatdırılma haqqı düzgün deyil");
      return;
    }
    setBusy(house.id);
    const res = await adminApi.patchDeliveryHouse(house.id, { delivery_fee: fee });
    if (res.success && res.data) {
      toast.success("Çatdırılma haqqı yadda saxlandı");
      setItems((current) =>
        current.map((row) => (row.id === house.id ? res.data!.house : row)),
      );
    } else {
      toast.error(res.error || "Yenilənmədi");
    }
    setBusy(null);
  }

  async function toggleProductActive(product: AdminDeliveryProduct) {
    setBusy(product.id);
    const res = await adminApi.updateDeliveryProductAdmin(product.id, {
      is_active: !product.is_active,
    });
    if (res.success) {
      await loadProducts();
      toast.success("Məhsul statusu yeniləndi");
    } else {
      toast.error(res.error || "Yenilənmədi");
    }
    setBusy(null);
  }

  async function saveStock(product: AdminDeliveryProduct) {
    const target = Number(stockDrafts[product.id] ?? product.quantity);
    if (!Number.isFinite(target) || target < 0) {
      toast.warning("Stok düzgün deyil");
      return;
    }
    const delta = target - product.quantity;
    if (delta === 0) return;
    setBusy(product.id);
    const res = await adminApi.adjustDeliveryProductStockAdmin(product.id, {
      quantity_delta: delta,
      note: "Admin panel",
    });
    if (res.success) {
      toast.success("Stok yeniləndi");
      await loadProducts();
    } else {
      toast.error(res.error || "Stok yenilənmədi");
    }
    setBusy(null);
  }

  async function createProduct() {
    const name = newProduct.name.trim();
    const price = Number(newProduct.price);
    const categoryId = Number(newProduct.category_id);
    const stock = Number(newProduct.stock || 0);
    if (!name) {
      toast.warning("Məhsul adı tələb olunur");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.warning("Qiymət düzgün deyil");
      return;
    }
    if (!Number.isFinite(categoryId) || categoryId <= 0) {
      toast.warning("Kateqoriya seçin");
      return;
    }
    setBusy(-2);
    const res = await adminApi.createDeliveryProductAdmin({
      name,
      price,
      category_id: categoryId,
      is_active: true,
    });
    if (res.success && res.data?.product && stock > 0) {
      await adminApi.adjustDeliveryProductStockAdmin(res.data.product.id, {
        quantity_delta: stock,
        note: "Initial stock",
      });
    }
    if (res.success) {
      toast.success("Məhsul əlavə edildi");
      setNewProduct({ name: "", price: "", category_id: "", stock: "" });
      await loadProducts();
    } else {
      toast.error(res.error || "Məhsul yaradılmadı");
    }
    setBusy(null);
  }

  if (loading || !admin) {
    return (
      <AdminShell>
        <div className="admin-page">
          <p>Yüklənir...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-page-head">
          <span className="section-kicker">Delivery</span>
          <h1>EVVA Delivery idarəetməsi</h1>
          <p>Evləri aktiv edin, çatdırılma haqqını tənzimləyin və məhsul stokunu idarə edin.</p>
        </div>

        <div className="admin-delivery-tabs">
          <button
            type="button"
            className={tab === "houses" ? "is-active" : ""}
            onClick={() => setTab("houses")}
          >
            <Bike size={16} /> Evlər
          </button>
          <button
            type="button"
            className={tab === "products" ? "is-active" : ""}
            onClick={() => setTab("products")}
          >
            <Package size={16} /> Məhsullar
          </button>
        </div>

        {tab === "houses" ? (
          <>
            <div className="admin-toolbar" style={{ marginBottom: 16 }}>
              <label className={`admin-setting-switch${moduleActive ? " is-selected" : ""}`}>
                <input
                  type="checkbox"
                  checked={moduleActive}
                  disabled={busy === -1}
                  onChange={() => void toggleModule()}
                />
                <span className="admin-setting-switch-control" />
                <span>
                  <strong>Delivery modulu</strong>
                  <small>{moduleActive ? "Aktiv" : "Deaktiv"}</small>
                </span>
              </label>
              <button
                type="button"
                className="admin-btn"
                disabled={pageLoading}
                onClick={() => void loadHouses()}
              >
                <RefreshCw size={15} /> Sinxronlaşdır
              </button>
              <span className="discover-pill">
                Aktiv: {activeCount} / {items.length}
              </span>
            </div>

            {error ? <p className="admin-error">{error}</p> : null}

            {pageLoading ? (
              <p>Yüklənir...</p>
            ) : items.length === 0 ? (
              <div className="admin-panel-card">
                <Bike size={28} style={{ opacity: 0.5 }} />
                <p style={{ margin: "12px 0 0", color: "var(--text-secondary)" }}>
                  Hələ delivery evi yoxdur. Əvvəlcə Booking-də ev əlavə edin, sonra bu səhifəni
                  yeniləyin.
                </p>
              </div>
            ) : (
              <div className="admin-delivery-grid">
                {items.map((house) => (
                  <article key={house.id} className="admin-panel-card admin-delivery-card">
                    <div className="admin-delivery-card-head">
                      <div>
                        <h3 style={{ margin: 0 }}>{house.title}</h3>
                        <p
                          style={{
                            margin: "6px 0 0",
                            color: "var(--text-secondary)",
                            fontSize: 13,
                          }}
                        >
                          {house.address || "Ünvan yoxdur"}
                        </p>
                        {house.property_id > 0 ? (
                          <Link
                            href={`/admin/properties/${house.property_id}`}
                            style={{ fontSize: 13, fontWeight: 700 }}
                          >
                            Booking ev #{house.property_id}
                          </Link>
                        ) : null}
                      </div>
                      <span className={`admin-status-pill${house.is_active ? " is-on" : ""}`}>
                        {house.is_active ? "Delivery aktiv" : "Passiv"}
                      </span>
                    </div>

                    <label
                      className={`admin-setting-switch${house.is_active ? " is-selected" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={house.is_active}
                        disabled={busy === house.id}
                        onChange={(e) => void toggleActive(house, e.target.checked)}
                      />
                      <span className="admin-setting-switch-control" />
                      <span>
                        <strong>Bu ev üçün Delivery aktiv olsun</strong>
                        <small>Saytda sifariş üçün seçilə bilən olsun</small>
                      </span>
                    </label>

                    <div className="admin-delivery-fee-row">
                      <label>
                        Çatdırılma haqqı (AZN)
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={feeDrafts[house.id] ?? ""}
                          onChange={(e) =>
                            setFeeDrafts((current) => ({
                              ...current,
                              [house.id]: e.target.value,
                            }))
                          }
                        />
                      </label>
                      <button
                        type="button"
                        className="admin-btn admin-btn--primary"
                        disabled={busy === house.id}
                        onClick={() => void saveFee(house)}
                      >
                        Haqqı saxla
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="admin-toolbar" style={{ marginBottom: 16 }}>
              <button
                type="button"
                className="admin-btn"
                disabled={productsLoading}
                onClick={() => void loadProducts()}
              >
                <RefreshCw size={15} /> Yenilə
              </button>
              <span className="discover-pill">{products.length} məhsul</span>
            </div>

            <div className="admin-panel-card admin-delivery-product-form">
              <h3 style={{ marginTop: 0 }}>Yeni məhsul</h3>
              <div className="admin-delivery-product-form-grid">
                <label>
                  Ad
                  <input
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct((current) => ({ ...current, name: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Qiymət (AZN)
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct((current) => ({ ...current, price: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Kateqoriya
                  <select
                    value={newProduct.category_id}
                    onChange={(e) =>
                      setNewProduct((current) => ({ ...current, category_id: e.target.value }))
                    }
                  >
                    <option value="">Seçin</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Başlanğıc stok
                  <input
                    type="number"
                    min={0}
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct((current) => ({ ...current, stock: e.target.value }))
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                disabled={busy === -2}
                onClick={() => void createProduct()}
              >
                Məhsul əlavə et
              </button>
            </div>

            {productsLoading ? (
              <p>Yüklənir...</p>
            ) : products.length === 0 ? (
              <div className="admin-panel-card">
                <Package size={28} style={{ opacity: 0.5 }} />
                <p style={{ margin: "12px 0 0", color: "var(--text-secondary)" }}>
                  Hələ məhsul yoxdur. Yuxarıdakı formdan əlavə edin.
                </p>
              </div>
            ) : (
              <div className="admin-delivery-products-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ad</th>
                      <th>Kateqoriya</th>
                      <th>Qiymət</th>
                      <th>Stok</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <strong>{product.name}</strong>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                            Mövcud: {product.available}
                          </div>
                        </td>
                        <td>{product.category || "-"}</td>
                        <td>{product.price.toFixed(2)} AZN</td>
                        <td>
                          <div className="admin-delivery-stock-row">
                            <input
                              type="number"
                              min={0}
                              value={stockDrafts[product.id] ?? product.quantity}
                              onChange={(e) =>
                                setStockDrafts((current) => ({
                                  ...current,
                                  [product.id]: e.target.value,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="admin-btn"
                              disabled={busy === product.id}
                              onClick={() => void saveStock(product)}
                            >
                              Saxla
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-status-pill${product.is_active ? " is-on" : ""}`}
                            disabled={busy === product.id}
                            onClick={() => void toggleProductActive(product)}
                          >
                            {product.is_active ? "Aktiv" : "Passiv"}
                          </button>
                        </td>
                        <td>{product.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
