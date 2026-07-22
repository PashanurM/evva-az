"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  CookingPot,
  ImageIcon,
  Images,
  MapPin,
  Save,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { adminApi } from "@/lib/admin-api";
import { assetUrl } from "@/lib/assets";
import { isPhoneFieldKey, sanitizePhoneInput } from "@/lib/phone";

type ModuleResource = "restaurants" | "places";

type ModuleField = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
};

const RESTAURANT_GROUPS: Array<{ title: string; icon: React.ReactNode; fields: ModuleField[] }> = [
  {
    title: "Əsas məlumatlar",
    icon: <UtensilsCrossed size={18} />,
    fields: [
      { key: "name", label: "Restoran adı *" },
      { key: "short_description", label: "Qısa təsvir" },
      { key: "description", label: "Ətraflı təsvir", type: "textarea" },
      { key: "average_price", label: "Orta qiymət", type: "number", placeholder: "Qiymət daxil edin" },
      { key: "discount_text", label: "Endirim mətni" },
      { key: "cuisine_tags", label: "Mətbəx teqləri" },
    ],
  },
  {
    title: "Ünvan və əlaqə",
    icon: <MapPin size={18} />,
    fields: [
      { key: "location", label: "Məkan" },
      { key: "address", label: "Tam ünvan" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "phone", label: "Telefon" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "opening_hours", label: "İş saatları" },
    ],
  },
  {
    title: "Menyu kateqoriyaları",
    icon: <CookingPot size={18} />,
    fields: [
      { key: "local_foods", label: "Yerli yeməklər", type: "textarea" },
      { key: "foreign_foods", label: "Xarici yeməklər", type: "textarea" },
      { key: "desserts", label: "Desertlər", type: "textarea" },
      { key: "drinks", label: "İçkilər", type: "textarea" },
    ],
  },
];

const PLACE_GROUPS: Array<{ title: string; icon: React.ReactNode; fields: ModuleField[] }> = [
  {
    title: "Əsas məlumatlar",
    icon: <MapPin size={18} />,
    fields: [
      { key: "title", label: "Məkan adı *" },
      { key: "category", label: "Kateqoriya" },
      { key: "short_description", label: "Qısa təsvir" },
      { key: "description", label: "Ətraflı təsvir", type: "textarea" },
      { key: "entry_price", label: "Giriş qiyməti", type: "number", placeholder: "Pulsuzdursa boş saxlayın" },
      {
        key: "activities_text",
        label: "Aktivliklər — hər sətir: Ad | Qiymət | Şəkil URL",
        type: "textarea",
        placeholder: "Kanat xətti | 25\nAt gəzintisi | 15\nQayıq turu | 20 | https://...",
      },
    ],
  },
  {
    title: "Ünvan və ziyarət",
    icon: <Clock size={18} />,
    fields: [
      { key: "location", label: "Məkan" },
      { key: "address", label: "Tam ünvan" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "working_hours", label: "İş saatları" },
      { key: "phone", label: "Telefon" },
      { key: "tips", label: "Ziyarət üçün məsləhətlər", type: "textarea" },
    ],
  },
];

function emptyForm(resource: ModuleResource): Record<string, unknown> {
  return resource === "restaurants"
    ? {
        name: "", short_description: "", description: "", location: "", address: "",
        latitude: "", longitude: "", phone: "", whatsapp: "", opening_hours: "",
        cuisine_tags: "", local_foods: "", foreign_foods: "", desserts: "", drinks: "",
        average_price: "", discount_text: "", is_featured: false, is_active: true,
      }
    : {
        title: "", short_description: "", description: "", category: "", location: "",
        address: "", latitude: "", longitude: "", entry_price: "", working_hours: "",
        phone: "", tips: "", activities_text: "", is_featured: false, is_active: true,
      };
}

function normalizeInitial(resource: ModuleResource, entity?: Record<string, unknown> | null) {
  const base = emptyForm(resource);
  if (!entity) return base;
  const normalized = { ...base, ...entity };
  if (resource === "places" && !normalized.activities_text) {
    try {
      const activities = JSON.parse(String(entity.activities_json || "[]")) as Array<{
        name?: string;
        price?: number;
        image?: string;
      }>;
      normalized.activities_text = activities
        .map((activity) =>
          [activity.name || "", activity.price ?? 0, activity.image || ""]
            .join(" | ")
            .replace(/\s+\|\s*$/, ""),
        )
        .join("\n");
    } catch {
      normalized.activities_text = "";
    }
  }
  for (const key of ["average_price", "entry_price"]) {
    if (Number(normalized[key] || 0) === 0) normalized[key] = "";
  }
  normalized.is_active = entity.is_active === true || entity.is_active === 1 || entity.is_active === "1";
  normalized.is_featured = entity.is_featured === true || entity.is_featured === 1 || entity.is_featured === "1";
  return normalized;
}

export function AdminModuleForm({
  resource,
  entity,
  onSaved,
  onCancel,
}: {
  resource: ModuleResource;
  entity?: Record<string, unknown> | null;
  onSaved: (id: number, entity?: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const editing = Boolean(entity?.id);
  const [form, setForm] = useState<Record<string, unknown>>(() => normalizeInitial(resource, entity));
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const groups = resource === "restaurants" ? RESTAURANT_GROUPS : PLACE_GROUPS;
  const coverPreview = useMemo(() => coverFile ? URL.createObjectURL(coverFile) : "", [coverFile]);
  const galleryPreviews = useMemo(
    () => galleryFiles.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [galleryFiles],
  );

  useEffect(() => {
    setForm(normalizeInitial(resource, entity));
  }, [entity, resource]);

  useEffect(() => () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
  }, [coverPreview]);

  useEffect(() => () => {
    galleryPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
  }, [galleryPreviews]);

  function update(key: string, value: unknown) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save() {
    const requiredKey = resource === "restaurants" ? "name" : "title";
    if (!String(form[requiredKey] || "").trim()) {
      toast.warning(resource === "restaurants" ? "Restoran adını daxil edin" : "Məkan adını daxil edin");
      return;
    }
    setSaving(true);
    const baseResult = editing
      ? await adminApi.updateEntity(resource, Number(entity?.id), form)
      : resource === "restaurants"
        ? await adminApi.createRestaurant(form)
        : await adminApi.savePlace(form);
    if (!baseResult.success || !baseResult.data) {
      toast.error(baseResult.error || "Məlumat saxlanılmadı");
      setSaving(false);
      return;
    }
    const id = Number(
      "id" in baseResult.data
        ? baseResult.data.id
        : entity?.id,
    );
    let latestEntity =
      "entity" in baseResult.data && baseResult.data.entity
        ? baseResult.data.entity as Record<string, unknown>
        : undefined;

    if (coverFile) {
      const coverResult = await adminApi.uploadEntityCover(resource, id, coverFile);
      if (!coverResult.success || !coverResult.data) {
        toast.error(coverResult.error || "Cover şəkli yüklənmədi");
        setSaving(false);
        return;
      }
      latestEntity = coverResult.data.entity;
    }
    if (galleryFiles.length > 0) {
      const galleryResult = await adminApi.uploadEntityImages(resource, id, galleryFiles);
      if (!galleryResult.success || !galleryResult.data) {
        toast.error(galleryResult.error || "Qalereya şəkilləri yüklənmədi");
        setSaving(false);
        return;
      }
      latestEntity = galleryResult.data.entity;
    }

    toast.success(editing ? "Məlumat yeniləndi." : "Yeni məlumat yaradıldı.");
    setSaving(false);
    onSaved(id, latestEntity);
  }

  const existingImages = Array.isArray(entity?.images)
    ? entity.images as Array<{ id: number; url?: string; image_path?: string }>
    : [];
  const existingCover = String(entity?.cover_url || entity?.cover_path || "");

  return (
    <section className="admin-panel-card admin-property-form admin-module-form">
      <div className="admin-property-form-head">
        <span>{resource === "restaurants" ? <UtensilsCrossed size={24} /> : <MapPin size={24} />}</span>
        <div>
          <h2>{editing ? "Məlumatı redaktə et" : resource === "restaurants" ? "Yeni restoran" : "Yeni məkan"}</h2>
          <p>Bütün məlumatları bölmələr üzrə doldurun və şəkilləri əlavə edin.</p>
        </div>
      </div>

      <div className="admin-module-form-status">
        <label className={`admin-setting-switch${form.is_active ? " is-selected" : ""}`}>
          <input type="checkbox" checked={Boolean(form.is_active)} onChange={(event) => update("is_active", event.target.checked)} />
          <span className="admin-setting-switch-control" />
          <span><strong>Aktiv</strong><small>Siyahıda göstərilsin</small></span>
        </label>
        <label className={`admin-setting-switch${form.is_featured ? " is-selected" : ""}`}>
          <input type="checkbox" checked={Boolean(form.is_featured)} onChange={(event) => update("is_featured", event.target.checked)} />
          <span className="admin-setting-switch-control" />
          <span><strong>Premium</strong><small>Önə çıxarılsın</small></span>
        </label>
      </div>

      <div className="admin-module-form-body">
        {groups.map((group) => (
          <section key={group.title} className="admin-form-section">
            <h3>{group.icon} {group.title}</h3>
            <div className="admin-form-grid">
              {group.fields.map((field) => (
                <label key={field.key} className={field.type === "textarea" ? "admin-form-field-wide" : undefined}>
                  {field.label}
                  {field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={String(form[field.key] ?? "")}
                      onChange={(event) => update(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      type={
                        isPhoneFieldKey(field.key)
                          ? "tel"
                          : field.type === "number"
                            ? "number"
                            : "text"
                      }
                      inputMode={isPhoneFieldKey(field.key) ? "numeric" : undefined}
                      pattern={isPhoneFieldKey(field.key) ? "[0-9]*" : undefined}
                      step={field.type === "number" ? "any" : undefined}
                      placeholder={field.placeholder}
                      value={String(form[field.key] ?? "")}
                      onChange={(event) =>
                        update(
                          field.key,
                          isPhoneFieldKey(field.key)
                            ? sanitizePhoneInput(event.target.value)
                            : event.target.value,
                        )
                      }
                    />
                  )}
                </label>
              ))}
            </div>
          </section>
        ))}

        <section className="admin-form-section">
          <h3><ImageIcon size={18} /> Cover və qalereya</h3>
          <p className="admin-module-image-hint">
            Cover kartlarda görünür. Qalereya şəkilləri detal səhifəsində göstərilir.
          </p>
          <div className="admin-module-image-columns">
            <div className="admin-module-image-panel">
              <div className="admin-module-image-panel__head">
                <strong>Cover şəkli</strong>
                <span>1 şəkil</span>
              </div>
              {coverPreview || existingCover ? (
                <div className="admin-module-cover-frame">
                  <img
                    className="admin-module-cover-preview"
                    src={coverPreview || assetUrl(existingCover)}
                    alt=""
                  />
                  {coverPreview ? <span className="admin-image-cover-badge">Yeni</span> : null}
                </div>
              ) : (
                <div className="admin-module-image-empty">Cover hələ seçilməyib</div>
              )}
              <label className="admin-file-drop">
                <ImageIcon size={18} aria-hidden="true" />
                <span>{coverPreview || existingCover ? "Cover-i dəyiş" : "Cover seç"}</span>
                <small>JPG, PNG, WEBP</small>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(event) => {
                    setCoverFile(event.target.files?.[0] || null);
                    event.target.value = "";
                  }}
                />
              </label>
              {coverFile ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--nowrap"
                  onClick={() => setCoverFile(null)}
                >
                  Cover seçimini sil
                </button>
              ) : null}
            </div>

            <div className="admin-module-image-panel">
              <div className="admin-module-image-panel__head">
                <strong>Qalereya şəkilləri</strong>
                <span>
                  {existingImages.length + galleryFiles.length > 0
                    ? `${existingImages.length + galleryFiles.length} şəkil`
                    : "Birdən çox"}
                </span>
              </div>
              {(existingImages.length > 0 || galleryPreviews.length > 0) ? (
                <div className="admin-image-grid admin-image-grid--compact">
                  {existingImages.map((image) => (
                    <div key={image.id} className="admin-image-card">
                      <img src={assetUrl(image.url || image.image_path || "")} alt="" />
                    </div>
                  ))}
                  {galleryPreviews.map((preview) => (
                    <div key={`${preview.file.name}-${preview.file.lastModified}`} className="admin-image-card admin-image-card--pending">
                      <img src={preview.url} alt={preview.file.name} />
                      <span className="admin-image-cover-badge">Yeni</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-module-image-empty">Qalereya şəkli yoxdur</div>
              )}
              <label className="admin-file-drop">
                <Images size={18} aria-hidden="true" />
                <span>{galleryFiles.length > 0 ? "Əlavə şəkil seç" : "Şəkillər seç"}</span>
                <small>
                  {galleryFiles.length > 0
                    ? `${galleryFiles.length} yeni fayl seçilib`
                    : "JPG, PNG, WEBP — çoxlu seçim"}
                </small>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={(event) => {
                    const next = Array.from(event.target.files || []);
                    if (next.length) setGalleryFiles((current) => [...current, ...next]);
                    event.target.value = "";
                  }}
                />
              </label>
              {galleryFiles.length > 0 ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--danger admin-btn--nowrap"
                  onClick={() => setGalleryFiles([])}
                >
                  Yeni seçimləri sil
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <div className="admin-property-form-actions">
          <button type="button" className="admin-btn admin-btn--primary admin-btn--nowrap" disabled={saving} onClick={() => void save()}>
            <Save size={16} /> {saving ? "Saxlanılır..." : editing ? "Yenilə" : "Yarat"}
          </button>
          <button type="button" className="admin-btn admin-btn--nowrap" disabled={saving} onClick={onCancel}>
            <X size={16} /> Ləğv et
          </button>
        </div>
      </div>
    </section>
  );
}
