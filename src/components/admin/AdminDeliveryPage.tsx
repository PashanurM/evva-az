"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bike, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { adminApi, type AdminDeliveryHouse } from "@/lib/admin-api";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdmin } from "@/providers/AdminProvider";

export function AdminDeliveryPage() {
  const { admin, loading } = useAdmin();
  const [items, setItems] = useState<AdminDeliveryHouse[]>([]);
  const [moduleActive, setModuleActive] = useState(true);
  const [activeCount, setActiveCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [feeDrafts, setFeeDrafts] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
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
    } else {
      setError(res.error || "Delivery evləri yüklənmədi");
    }
    setPageLoading(false);
  }, []);

  useEffect(() => {
    if (!admin) return;
    void load();
  }, [admin, load]);

  async function toggleModule() {
    setBusy(-1);
    const res = await adminApi.patchModule("delivery", !moduleActive);
    if (res.success) {
      toast.success("Delivery modulu yeniləndi");
      await load();
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
          <h1>EVVA Delivery evləri</h1>
          <p>
            Booking evlərini Delivery-ə uyğun aktiv edin. Aktiv evlər saytda `/delivery`
            siyahısında görünür.
          </p>
        </div>

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
            onClick={() => void load()}
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
                    <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 13 }}>
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

                <label className={`admin-setting-switch${house.is_active ? " is-selected" : ""}`}>
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
                    Çatdırılma haqqı (₼)
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
      </div>
    </AdminShell>
  );
}
