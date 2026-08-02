"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CookingPot,
  Package,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";
import {
  adminApi,
  type RestaurantMenuCategory,
  type RestaurantMenuItem,
  type RestaurantMenuTree,
} from "@/lib/admin-api";
import { assetUrl } from "@/lib/assets";

type ItemDraft = {
  id?: number;
  category_id: number;
  title: string;
  ingredients: string;
  price: string;
  is_featured: boolean;
};

const EMPTY_ITEM: ItemDraft = {
  category_id: 0,
  title: "",
  ingredients: "",
  price: "",
  is_featured: false,
};

export function AdminRestaurantMenuEditor({ restaurantId }: { restaurantId: number }) {
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [menu, setMenu] = useState<RestaurantMenuTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<"menu" | "meal_set">("menu");
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [itemDraft, setItemDraft] = useState<ItemDraft>(EMPTY_ITEM);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await adminApi.getRestaurantMenu(restaurantId, true);
    if (!res.success || !res.data) {
      toast.error(res.error || "Menyu yüklənmədi");
      setMenu(null);
    } else {
      setMenu(res.data);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(
    () => (menu?.categories || []).filter((c) => c.kind === tab),
    [menu, tab],
  );

  const activeCategoryId = itemDraft.category_id || categories[0]?.id || 0;

  useEffect(() => {
    if (!itemDraft.category_id && categories[0]?.id) {
      setItemDraft((current) => ({ ...current, category_id: categories[0].id }));
    }
  }, [categories, itemDraft.category_id]);

  async function addCategory() {
    const title = newCategoryTitle.trim();
    if (!title) {
      toast.warning("Kateqoriya adı yazın");
      return;
    }
    setBusy(true);
    const res = await adminApi.saveRestaurantMenuCategory(restaurantId, {
      title,
      kind: tab,
    });
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Kateqoriya yaradılmadı");
      return;
    }
    setMenu(res.data.menu);
    setNewCategoryTitle("");
    toast.success("Kateqoriya əlavə olundu");
  }

  async function removeCategory(category: RestaurantMenuCategory) {
    const ok = await confirm({
      title: "Kateqoriyanı sil",
      message: `"${category.title}" silinsin? Məhsullar kateqoriyasız qalacaq.`,
      confirmLabel: "Sil",
    });
    if (!ok) return;
    setBusy(true);
    const res = await adminApi.deleteRestaurantMenuCategory(restaurantId, category.id);
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Silinmədi");
      return;
    }
    setMenu(res.data.menu);
    toast.success("Kateqoriya silindi");
  }

  function editItem(item: RestaurantMenuItem) {
    setItemDraft({
      id: item.id,
      category_id: item.category_id,
      title: item.title,
      ingredients: item.ingredients || item.description || "",
      price: item.price ? String(item.price) : "",
      is_featured: Boolean(item.is_featured),
    });
  }

  async function saveItem() {
    if (!itemDraft.title.trim()) {
      toast.warning("Məhsul adı yazın");
      return;
    }
    if (!itemDraft.category_id) {
      toast.warning("Kateqoriya seçin");
      return;
    }
    const price = Number(itemDraft.price);
    if (!Number.isFinite(price) || price < 0) {
      toast.warning("Qiymət düzgün deyil");
      return;
    }
    if (price <= 0) {
      toast.warning("Qiymət əlavə edin (₼)");
      return;
    }
    const isCreate = !itemDraft.id;
    if (isCreate) {
      toast.warning("Əvvəlcə məhsulu saxlayın, sonra mütləq şəkil yükləyin. Şəkilsiz menyu göstərilməyəcək.");
    }
    const existingHasImage = Boolean(
      itemDraft.id && menu?.categories
        ?.flatMap((c) => c.items)
        .find((i) => i.id === itemDraft.id && (i.image_url || i.image_path)),
    );
    if (!isCreate && itemDraft.is_featured && !existingHasImage) {
      toast.error("Məşhur məhsul üçün şəkil mütləqdir. Əvvəlcə şəkil yükləyin.");
      return;
    }
    setBusy(true);
    const res = await adminApi.saveRestaurantMenuItem(
      restaurantId,
      {
        category_id: itemDraft.category_id,
        title: itemDraft.title.trim(),
        ingredients: itemDraft.ingredients.trim(),
        description: itemDraft.ingredients.trim().slice(0, 255),
        price,
        is_featured: itemDraft.is_featured,
      },
      itemDraft.id,
    );
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Məhsul saxlanılmadı");
      return;
    }
    setMenu(res.data.menu);
    const savedItem = res.data.item;
    if (isCreate) {
      // Keep draft open on created item so admin can upload the required image.
      setItemDraft({
        id: savedItem.id,
        category_id: savedItem.category_id,
        title: savedItem.title,
        ingredients: savedItem.ingredients || "",
        price: String(savedItem.price ?? ""),
        is_featured: Boolean(savedItem.is_featured),
      });
      toast.success("Məhsul əlavə olundu — indi şəkil yükləyin (mütləq).");
      return;
    }
    setItemDraft({ ...EMPTY_ITEM, category_id: itemDraft.category_id });
    toast.success("Məhsul yeniləndi");
  }

  async function removeItem(item: RestaurantMenuItem) {
    const ok = await confirm({
      title: "Məhsulu sil",
      message: `"${item.title}" silinsin?`,
      confirmLabel: "Sil",
    });
    if (!ok) return;
    setBusy(true);
    const res = await adminApi.deleteRestaurantMenuItem(restaurantId, item.id);
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Silinmədi");
      return;
    }
    setMenu(res.data.menu);
    if (itemDraft.id === item.id) {
      setItemDraft({ ...EMPTY_ITEM, category_id: item.category_id });
    }
    toast.success("Məhsul silindi");
  }

  async function uploadImage(item: RestaurantMenuItem, file: File | null) {
    if (!file) return;
    setBusy(true);
    const res = await adminApi.uploadRestaurantMenuItemImage(restaurantId, item.id, file);
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Şəkil yüklənmədi");
      return;
    }
    setMenu(res.data.menu);
    toast.success("Şəkil yükləndi");
  }

  if (loading) {
    return (
      <section className="admin-form-section">
        <h3><CookingPot size={18} /> Menyu</h3>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Menyu yüklənir…</p>
      </section>
    );
  }

  return (
    <section className="admin-form-section admin-restaurant-menu">
      <h3><CookingPot size={18} /> Strukturlaşdırılmış menyu</h3>
      <p className="admin-module-image-hint">
        Kateqoriyalar (yemək, salat, içki və s.) və hazır setlər. Hər məhsula ad, şəkil, ingredientlər və qiymət əlavə edin.
      </p>

      <div className="admin-menu-tabs">
        <button
          type="button"
          className={`admin-btn${tab === "menu" ? " admin-btn--primary" : ""}`}
          onClick={() => setTab("menu")}
        >
          <CookingPot size={15} /> Menyu kateqoriyaları
        </button>
        <button
          type="button"
          className={`admin-btn${tab === "meal_set" ? " admin-btn--primary" : ""}`}
          onClick={() => setTab("meal_set")}
        >
          <Package size={15} /> Hazır yemək setləri
        </button>
      </div>

      <div className="admin-menu-category-add">
        <input
          type="text"
          placeholder={tab === "meal_set" ? "Yeni set kateqoriyası" : "Yeni kateqoriya (məs: Salatlar)"}
          value={newCategoryTitle}
          onChange={(e) => setNewCategoryTitle(e.target.value)}
        />
        <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={() => void addCategory()}>
          <Plus size={15} /> Kateqoriya
        </button>
      </div>

      <div className="admin-menu-item-form">
        <strong>{itemDraft.id ? "Məhsulu redaktə et" : "Yeni məhsul"}</strong>
        <div className="admin-form-grid">
          <label>
            Kateqoriya
            <select
              value={activeCategoryId || ""}
              onChange={(e) =>
                setItemDraft((current) => ({ ...current, category_id: Number(e.target.value) || 0 }))
              }
            >
              <option value="">Seçin</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ad *
            <input
              type="text"
              value={itemDraft.title}
              onChange={(e) => setItemDraft((current) => ({ ...current, title: e.target.value }))}
              placeholder="Məs: Kabab / Cola / Set 1"
            />
          </label>
          <label>
            Qiymət (₼) *
            <input
              type="number"
              min={0.01}
              step="0.01"
              required
              value={itemDraft.price}
              onChange={(e) => setItemDraft((current) => ({ ...current, price: e.target.value }))}
              placeholder="Məs: 12.50"
            />
          </label>
          <label className="admin-form-field-wide">
            Ingredientlər / tərkib
            <textarea
              rows={3}
              value={itemDraft.ingredients}
              onChange={(e) => setItemDraft((current) => ({ ...current, ingredients: e.target.value }))}
              placeholder="Məs: toyuq, düyü, göyərti…"
            />
          </label>
          <label className="admin-setting-switch">
            <input
              type="checkbox"
              checked={itemDraft.is_featured}
              onChange={(e) =>
                setItemDraft((current) => ({ ...current, is_featured: e.target.checked }))
              }
            />
            Məşhur / featured
          </label>
        </div>
        <div className="admin-property-form-actions" style={{ marginTop: 10 }}>
          <button type="button" className="admin-btn admin-btn--primary" disabled={busy} onClick={() => void saveItem()}>
            <Plus size={15} /> {itemDraft.id ? "Yenilə" : "Əlavə et"}
          </button>
          {itemDraft.id ? (
            <button
              type="button"
              className="admin-btn"
              disabled={busy}
              onClick={() => setItemDraft({ ...EMPTY_ITEM, category_id: activeCategoryId })}
            >
              Ləğv et
            </button>
          ) : null}
        </div>
      </div>

      {categories.length === 0 ? (
        <p style={{ margin: "12px 0 0", color: "var(--text-muted)" }}>
          Hələ kateqoriya yoxdur. Yuxarıdan əlavə edin.
        </p>
      ) : (
        <div className="admin-menu-categories">
          {categories.map((category) => (
            <article key={category.id} className="admin-menu-category-card">
              <header>
                <div>
                  <strong>{category.title}</strong>
                  <span>{category.items.length} məhsul</span>
                </div>
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--nowrap"
                  disabled={busy}
                  onClick={() => void removeCategory(category)}
                >
                  <Trash2 size={14} /> Sil
                </button>
              </header>
              {category.items.length === 0 ? (
                <p className="admin-menu-empty">Bu kateqoriyada məhsul yoxdur.</p>
              ) : (
                <div className="admin-menu-items-grid">
                  {category.items.map((item) => (
                    <div key={item.id} className="admin-menu-item-card">
                      <div className="admin-menu-item-media">
                        {item.image_url ? (
                          <img src={assetUrl(item.image_url)} alt={item.title} />
                        ) : (
                          <span>Şəkil yoxdur</span>
                        )}
                      </div>
                      <div className="admin-menu-item-body">
                        <strong>{item.title}</strong>
                        <em>{Number(item.price || 0).toFixed(2)} ₼</em>
                        {item.ingredients ? <p>{item.ingredients}</p> : null}
                      </div>
                      <div className="admin-menu-item-actions">
                        <button type="button" className="admin-btn" onClick={() => editItem(item)}>
                          <Pencil size={14} />
                        </button>
                        <label className="admin-btn">
                          <Upload size={14} />
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            hidden
                            onChange={(e) => {
                              void uploadImage(item, e.target.files?.[0] || null);
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          className="admin-btn admin-btn--danger"
                          onClick={() => void removeItem(item)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
      {confirmModal}
    </section>
  );
}
