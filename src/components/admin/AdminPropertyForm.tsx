"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  BedDouble,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  GripVertical,
  Home,
  ImageIcon,
  Search,
  Star,
  Tags,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { assetUrl } from "@/lib/assets";
import { sanitizePhoneInput } from "@/lib/phone";
import {
  adminApi,
  type AdminPropertyDetail,
  type AdminPropertyFormMeta,
  type AdminPropertyImage,
  type AdminPropertyPayload,
} from "@/lib/admin-api";
import { useAdminConfirm } from "@/components/admin/AdminConfirmModal";

const AMENITIES = [
  { key: "wifi", label: "Wi-Fi" },
  { key: "parking", label: "Parking" },
  { key: "kitchen", label: "Mətbəx" },
  { key: "air_conditioner", label: "Kondisioner" },
  { key: "heating", label: "İstilik" },
  { key: "washing_machine", label: "Paltaryuyan" },
  { key: "barbecue", label: "Manqal" },
  { key: "heated_pool", label: "İsti hovuz" },
  { key: "children_allowed", label: "Uşaqlar" },
  { key: "pets_allowed", label: "Ev heyvanları" },
] as const;

type AmenityKey = (typeof AMENITIES)[number]["key"];

function readAmenity(p: AdminPropertyDetail, key: AmenityKey): boolean {
  return Boolean(p[key]);
}

type FormState = {
  title: string;
  location: string;
  price: string;
  capacity: string;
  rooms: string;
  description: string;
  single_beds: string;
  double_beds: string;
  sofa_beds: string;
  bathrooms: string;
  minimum_nights: string;
  check_in_time: string;
  check_out_time: string;
  map_address: string;
  latitude: string;
  longitude: string;
  house_rules: string;
  cancellation_policy: string;
  owner_choice: "admin" | "existing" | "new";
  owner_id: string;
  new_owner_name: string;
  new_owner_phone: string;
  new_owner_password: string;
  new_owner_password_confirm: string;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  amenities: Record<string, boolean>;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  sizeLabel: string;
};

function optionalNumber(value: unknown): string {
  const number = Number(value ?? 0);
  return number === 0 ? "" : String(value);
}

const emptyForm = (): FormState => ({
  title: "",
  location: "",
  price: "",
  capacity: "",
  rooms: "",
  description: "",
  single_beds: "",
  double_beds: "",
  sofa_beds: "",
  bathrooms: "",
  minimum_nights: "1",
  check_in_time: "15:00",
  check_out_time: "12:00",
  map_address: "",
  latitude: "",
  longitude: "",
  house_rules: "",
  cancellation_policy: "",
  owner_choice: "new",
  owner_id: "",
  new_owner_name: "",
  new_owner_phone: "",
  new_owner_password: "",
  new_owner_password_confirm: "",
  is_active: true,
  is_featured: false,
  tags: [],
  amenities: Object.fromEntries(AMENITIES.map((a) => [a.key, false])),
});

function detailToForm(p: AdminPropertyDetail): FormState {
  const amenities = Object.fromEntries(AMENITIES.map((a) => [a.key, readAmenity(p, a.key)]));
  return {
    title: p.title || "",
    location: p.location || "",
    price: optionalNumber(p.price),
    capacity: optionalNumber(p.capacity),
    rooms: optionalNumber(p.rooms),
    description: p.description || "",
    single_beds: optionalNumber(p.single_beds),
    double_beds: optionalNumber(p.double_beds),
    sofa_beds: optionalNumber(p.sofa_beds),
    bathrooms: optionalNumber(p.bathrooms),
    minimum_nights: optionalNumber(p.minimum_nights) || "1",
    check_in_time: p.check_in_time || "15:00",
    check_out_time: p.check_out_time || "12:00",
    map_address: p.map_address || "",
    latitude: p.latitude ? String(p.latitude) : "",
    longitude: p.longitude ? String(p.longitude) : "",
    house_rules: p.house_rules || "",
    cancellation_policy: p.cancellation_policy || "",
    owner_choice: "existing",
    owner_id: String(p.owner_user_id ?? ""),
    new_owner_name: "",
    new_owner_phone: "",
    new_owner_password: "",
    new_owner_password_confirm: "",
    is_active: p.is_active,
    is_featured: p.is_featured,
    tags: p.tags_list || [],
    amenities,
  };
}

function formToPayload(form: FormState): AdminPropertyPayload {
  return {
    title: form.title.trim(),
    location: form.location.trim(),
    price: Number(form.price),
    capacity: Number(form.capacity),
    rooms: Number(form.rooms),
    description: form.description.trim(),
    single_beds: Number(form.single_beds),
    double_beds: Number(form.double_beds),
    sofa_beds: Number(form.sofa_beds),
    bathrooms: Number(form.bathrooms),
    minimum_nights: Number(form.minimum_nights),
    check_in_time: form.check_in_time,
    check_out_time: form.check_out_time,
    map_address: form.map_address,
    latitude: form.latitude || null,
    longitude: form.longitude || null,
    house_rules: form.house_rules,
    cancellation_policy: form.cancellation_policy,
    owner_choice: form.owner_choice,
    owner_id: form.owner_choice === "existing" ? Number(form.owner_id) : undefined,
    new_owner_name: form.owner_choice === "new" ? form.new_owner_name : undefined,
    new_owner_phone: form.owner_choice === "new" ? form.new_owner_phone : undefined,
    new_owner_password: form.owner_choice === "new" ? form.new_owner_password : undefined,
    new_owner_password_confirm: form.owner_choice === "new" ? form.new_owner_password_confirm : undefined,
    is_active: form.is_active,
    is_featured: form.is_featured,
    tags: form.tags,
    ...form.amenities,
  };
}

export function AdminPropertyForm({
  propertyId,
  onSaved,
  onCancel,
}: {
  propertyId?: number | null;
  onSaved: (result?: { keepOpen?: boolean; id?: number }) => void;
  onCancel: () => void;
}) {
  const { confirm, modal: confirmModal } = useAdminConfirm();
  const [meta, setMeta] = useState<AdminPropertyFormMeta | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [ownerQuery, setOwnerQuery] = useState("");
  const [pendingCover, setPendingCover] = useState<PendingImage | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [existingCover, setExistingCover] = useState<AdminPropertyImage | null>(null);
  const [existingImages, setExistingImages] = useState<AdminPropertyDetail["images"]>([]);
  const [activeId, setActiveId] = useState<number | null>(propertyId ?? null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [draggedImageId, setDraggedImageId] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const pendingCoverRef = useRef<PendingImage | null>(null);
  const pendingImagesRef = useRef<PendingImage[]>([]);

  useEffect(() => {
    pendingCoverRef.current = pendingCover;
  }, [pendingCover]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    return () => {
      if (pendingCoverRef.current) {
        URL.revokeObjectURL(pendingCoverRef.current.previewUrl);
      }
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
  }, []);

  useEffect(() => {
    if (pendingImages.length === 0) return;
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pendingImages.length]);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setPendingCover((current) => {
        if (current) URL.revokeObjectURL(current.previewUrl);
        return null;
      });
      setPendingImages((current) => {
        current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return [];
      });
      setActiveId(propertyId ?? null);
      const metaRes = await adminApi.getPropertyFormMeta();
      if (!metaRes.success || !metaRes.data) {
        toast.error(metaRes.error || "Form məlumatları yüklənmədi");
        setLoading(false);
        return;
      }
      setMeta(metaRes.data);

      if (propertyId) {
        const propRes = await adminApi.getProperty(propertyId);
        if (propRes.success && propRes.data) {
          setForm(detailToForm(propRes.data.property));
          setExistingCover(propRes.data.property.cover_image || null);
          setExistingImages(propRes.data.property.images || []);
        } else {
          toast.error(propRes.error || "Mülk yüklənmədi");
        }
      } else {
        setForm(emptyForm());
        setExistingCover(null);
        setExistingImages([]);
      }
      setLoading(false);
    })();
  }, [propertyId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const filteredOwners = useMemo(() => {
    if (!meta) return [];
    const q = ownerQuery.trim().toLowerCase();
    if (!q) return meta.owners;
    return meta.owners.filter((o) => {
      const haystack = [o.full_name, o.username, o.phone, o.owner_login_id, o.role]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [meta, ownerQuery]);

  const selectedOwner = useMemo(() => {
    if (!meta || !form.owner_id) return null;
    return meta.owners.find((o) => String(o.id) === form.owner_id) ?? null;
  }, [meta, form.owner_id]);

  function toggleTag(tag: string) {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }));
  }

  function pendingImageFromFile(file: File): PendingImage {
    return {
      id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      sizeLabel:
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    };
  }

  function onPickCover(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setPendingCover((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return pendingImageFromFile(file);
    });
    toast.info("Yeni cover şəkli seçildi.");
  }

  function onPickFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const selected = Array.from(list);
    setPendingImages((prev) => [
      ...prev,
      ...selected.map(pendingImageFromFile),
    ]);
    toast.info(`${selected.length} şəkil seçildi.`);
  }

  function removePending(id: string) {
    setPendingImages((prev) => {
      const removed = prev.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  }

  async function uploadPendingCover(targetId: number) {
    if (!pendingCover) return true;
    setImageBusy(true);
    toast.info("Cover şəkli hazırlanır və yüklənir…");
    try {
      const res = await adminApi.uploadPropertyCover(targetId, pendingCover.file);
      if (!res.success || !res.data) {
        toast.error(res.error || "Cover şəkli yüklənmədi");
        return false;
      }
      setExistingCover(res.data.cover_image);
      setExistingImages(res.data.images || []);
      URL.revokeObjectURL(pendingCover.previewUrl);
      setPendingCover(null);
      toast.success("Cover şəkli uğurla yükləndi.");
      return true;
    } catch {
      toast.error("Cover şəkli yüklənmədi");
      return false;
    } finally {
      setImageBusy(false);
    }
  }

  async function uploadPending(targetId: number) {
    if (pendingImages.length === 0) return true;
    const files = pendingImages.map((image) => image.file);
    const count = files.length;
    setImageBusy(true);
    toast.info(`${count} şəkil avtomatik kiçildilib yüklənir…`);
    try {
      const res = await adminApi.uploadPropertyImages(targetId, files);
      if (!res.success || !res.data) {
        toast.error(res.error || "Şəkillər yüklənmədi");
        return false;
      }
      setExistingImages(res.data.images || []);
      setExistingCover(res.data.cover_image || null);
      setPendingImages((current) => {
        current.forEach((image) => URL.revokeObjectURL(image.previewUrl));
        return [];
      });
      const uploadedCount = res.data.uploaded?.length || count;
      toast.success(`${uploadedCount} şəkil uğurla yükləndi.`);
      return true;
    } catch {
      toast.error("Şəkillər yüklənmədi");
      return false;
    } finally {
      setImageBusy(false);
    }
  }

  async function handleUploadNow() {
    if (!activeId) {
      toast.warning("Əvvəlcə mülkü yaradın, sonra şəkil yükləyin — və ya formu saxlayın.");
      return;
    }
    if (pendingImages.length === 0) {
      toast.warning("Şəkil seçin");
      return;
    }
    await uploadPending(activeId);
  }

  async function handleCoverUploadNow() {
    if (!activeId) {
      toast.warning("Əvvəlcə mülkü yaradın — və ya formu saxlayın.");
      return;
    }
    if (!pendingCover) {
      toast.warning("Cover şəkli seçin");
      return;
    }
    await uploadPendingCover(activeId);
  }

  async function handleDeleteImage(imageId: number) {
    if (!activeId) return;
    const ok = await confirm({
      title: "Şəkli sil",
      message: "Bu şəkil silinsin?\n\nBu əməliyyat geri qaytarılmır.",
    });
    if (!ok) return;
    setImageBusy(true);
    const res = await adminApi.deletePropertyImage(activeId, imageId);
    setImageBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Şəkil silinmədi");
      return;
    }
    setExistingImages(res.data.images || []);
    setExistingCover(res.data.cover_image || null);
    toast.success("Şəkil silindi.");
  }

  async function handleSetCover(imageId: number) {
    if (!activeId || imageBusy) return;

    setImageBusy(true);
    const res = await adminApi.setPropertyCover(activeId, imageId);
    setImageBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.error || "Cover şəkli yenilənmədi");
      return;
    }

    setExistingCover(res.data.cover_image);
    setExistingImages(res.data.images || []);
    setPendingCover((current) => {
      if (current) URL.revokeObjectURL(current.previewUrl);
      return null;
    });
    toast.success("Cover şəkli yeniləndi.");
  }

  async function persistImageOrder(
    nextImages: AdminPropertyImage[],
    previousImages: AdminPropertyImage[],
  ) {
    if (!activeId || imageBusy) return;

    setExistingImages(nextImages);
    setImageBusy(true);
    const res = await adminApi.reorderPropertyImages(
      activeId,
      nextImages.map((image) => image.id),
    );
    setImageBusy(false);
    if (!res.success || !res.data) {
      setExistingImages(previousImages);
      toast.error(res.error || "Şəkil sırası saxlanılmadı");
      return;
    }

    setExistingImages(res.data.images || []);
    setExistingCover(res.data.cover_image || null);
    toast.success("Şəkil sırası yeniləndi.");
  }

  function moveExistingImage(imageId: number, delta: -1 | 1) {
    if (imageBusy) return;
    const fromIndex = existingImages.findIndex((image) => image.id === imageId);
    const toIndex = fromIndex + delta;
    if (fromIndex < 0 || toIndex < 0 || toIndex >= existingImages.length) return;

    const previousImages = [...existingImages];
    const nextImages = [...existingImages];
    const [moved] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, moved);
    void persistImageOrder(nextImages, previousImages);
  }

  function dropExistingImage(targetId: number) {
    if (draggedImageId === null || draggedImageId === targetId || imageBusy) {
      setDraggedImageId(null);
      return;
    }

    const fromIndex = existingImages.findIndex((image) => image.id === draggedImageId);
    const toIndex = existingImages.findIndex((image) => image.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      setDraggedImageId(null);
      return;
    }

    const previousImages = [...existingImages];
    const nextImages = [...existingImages];
    const [moved] = nextImages.splice(fromIndex, 1);
    nextImages.splice(toIndex, 0, moved);
    setDraggedImageId(null);
    void persistImageOrder(nextImages, previousImages);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || imageBusy) return;

    const isNew = !activeId;
    if (isNew) {
      if (form.owner_choice !== "existing") {
        if (!form.new_owner_name.trim() || !form.new_owner_phone.trim()) {
          toast.error("Yeni ev üçün sahib adı və telefon nömrəsi mütləqdir.");
          return;
        }
      } else if (!form.owner_id) {
        toast.error("Mövcud ev sahibi seçin.");
        return;
      }
    }

    setSaving(true);

    type SaveResult = {
      message: string;
      id: number;
      property_id: number;
      new_owner_credentials?: Record<string, string>;
    };

    let savedId = 0;
    let credentials: Record<string, string> | undefined;
    let saveMessage = "";

    try {
      const payload = formToPayload({
        ...form,
        owner_choice: isNew && form.owner_choice === "admin" ? "new" : form.owner_choice,
      });

      let res: { success: boolean; error?: string; data?: SaveResult; status?: number };
      if (isNew) {
        res = await adminApi.createProperty(payload);
      } else {
        res = await adminApi.updateProperty(activeId, payload);
      }

      if (!res.success || !res.data) {
        toast.error(res.error || "Saxlanılmadı");
        return;
      }

      savedId = res.data.property_id || res.data.id;
      credentials = res.data.new_owner_credentials;
      saveMessage = res.data.message || (isNew ? "Mülk yaradıldı." : "Mülk yeniləndi.");
      setActiveId(savedId);
      toast.success(saveMessage);

      if (credentials) {
        toast.info(
          `Yeni sahib: ${credentials.full_name || "—"} | username: ${credentials.username || "—"} | telefon: ${credentials.phone || "—"} | şifrə: ${credentials.password || "—"}`,
          { autoClose: false },
        );
      }
    } catch {
      toast.error("Saxlama zamanı xəta baş verdi. Yenidən cəhd edin.");
      return;
    } finally {
      // Metadata save must never leave the button stuck on "Saxlanılır..."
      setSaving(false);
    }

    if (!savedId) return;

    // Images are uploaded after the property exists — failures should not undo create.
    const hasPendingMedia = Boolean(pendingCover) || pendingImages.length > 0;
    if (hasPendingMedia) {
      let mediaOk = true;
      if (pendingCover) {
        mediaOk = (await uploadPendingCover(savedId)) && mediaOk;
      }
      if (pendingImages.length > 0) {
        mediaOk = (await uploadPending(savedId)) && mediaOk;
      }
      if (!mediaOk) {
        toast.warning("Mülk saxlandı, amma bəzi şəkillər yüklənmədi. Şəkilləri yenidən seçib yükləyin.");
      }
    } else {
      const detail = await adminApi.getProperty(savedId);
      if (detail.success && detail.data) {
        setExistingCover(detail.data.property.cover_image || null);
        setExistingImages(detail.data.property.images || []);
      }
    }

    onSaved({ keepOpen: true, id: savedId });
  }

  if (loading) return <div className="admin-loading">Form yüklənir...</div>;

  return (
    <section className="admin-panel-card admin-property-form">
      <div className="admin-property-form-head">
        <span><Home size={24} /></span>
        <div>
          <h2>{propertyId ? "Mülkü redaktə et" : "Yeni mülk əlavə et"}</h2>
          <p>Mülkün məlumatlarını bölmələr üzrə doldurun və dəyişiklikləri yadda saxlayın.</p>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <div className="admin-form-section">
          <h3><CircleCheck size={18} /> Yayımlanma statusu</h3>
          <div className="admin-setting-grid">
            <label className={`admin-setting-switch${form.is_active ? " is-selected" : ""}`}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => update("is_active", e.target.checked)} />
              <span className="admin-setting-switch-control" />
              <span><strong>Aktiv</strong><small>Mülk saytda görünsün</small></span>
            </label>
            <label className={`admin-setting-switch${form.is_featured ? " is-selected" : ""}`}>
              <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} />
              <span className="admin-setting-switch-control" />
              <span><strong>Premium</strong><small>Mülk önə çıxarılsın</small></span>
            </label>
          </div>
        </div>

        <div className="admin-form-section">
          <h3><Home size={18} /> Əsas məlumatlar</h3>
          <div className="admin-form-grid">
          <label>
            Başlıq *
            <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
          </label>
          <label>
            Yaxınlıq *
            <input value={form.location} onChange={(e) => update("location", e.target.value)} required />
          </label>
          <label>
            Qiymət (₼) *
            <input type="number" min={1} value={form.price} onChange={(e) => update("price", e.target.value)} required />
          </label>
          <label>
            Maks. qonaq *
            <input type="number" min={1} value={form.capacity} onChange={(e) => update("capacity", e.target.value)} required />
          </label>
          <label>
            Otaq sayı *
            <input type="number" min={1} value={form.rooms} onChange={(e) => update("rooms", e.target.value)} required />
          </label>
          <label>
            Minimum gecə
            <input type="number" min={1} value={form.minimum_nights} onChange={(e) => update("minimum_nights", e.target.value)} />
          </label>
          </div>

          <label className="admin-form-textarea-field">
            Təsvir *
            <textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value.slice(0, 2000))}
              required
              rows={5}
              maxLength={2000}
            />
            <small style={{ fontWeight: 600 }}>
              {form.description.length}/2000
            </small>
          </label>

          <label className="admin-form-textarea-field">
            Ev qaydaları
            <textarea
              value={form.house_rules}
              onChange={(e) => update("house_rules", e.target.value.slice(0, 2000))}
              rows={4}
              maxLength={2000}
              placeholder="Məs: siqaret çəkmək qadağandır, səs-küy..."
            />
          </label>

          <label className="admin-form-textarea-field">
            Ləğv qaydaları
            <textarea
              value={form.cancellation_policy}
              onChange={(e) => update("cancellation_policy", e.target.value.slice(0, 2000))}
              rows={4}
              maxLength={2000}
              placeholder="Məs: 48 saat əvvəl pulsuz ləğv..."
            />
          </label>
        </div>

        <div className="admin-form-section">
          <h3><ImageIcon size={18} /> Cover şəkli</h3>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-muted)" }}>
            Mülk kartlarında görünəcək əsas şəkli seçin.
          </p>
          {existingCover ? (
            <div className="admin-image-grid" style={{ marginBottom: 12 }}>
              <div className="admin-image-card is-cover">
                <img src={assetUrl(existingCover.url || existingCover.image_path)} alt="Cover" />
                <span className="admin-image-cover-badge">Cover</span>
                <div className="admin-image-card-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    disabled={imageBusy}
                    onClick={() => void handleDeleteImage(existingCover.id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Cover şəkli yoxdur.</p>
          )}
          <label className="admin-file-pick">
            <span>{existingCover ? "Cover-i dəyiş" : "Cover seç"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                onPickCover(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {pendingCover ? (
            <div className="admin-image-grid" style={{ marginTop: 14 }}>
              <div className="admin-image-card admin-image-card--pending is-cover">
                <img src={pendingCover.previewUrl} alt={pendingCover.file.name} />
                <span className="admin-image-cover-badge">Yeni cover</span>
                <div className="admin-image-card-meta">
                  <span title={pendingCover.file.name}>{pendingCover.file.name}</span>
                  <small>{pendingCover.sizeLabel}</small>
                </div>
                <div className="admin-image-card-actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => {
                      URL.revokeObjectURL(pendingCover.previewUrl);
                      setPendingCover(null);
                    }}
                  >
                    Çıxar
                  </button>
                </div>
              </div>
            </div>
          ) : null}
          {pendingCover && activeId ? (
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              style={{ marginTop: 12 }}
              disabled={imageBusy}
              onClick={() => void handleCoverUploadNow()}
            >
              {imageBusy ? "Yüklənir..." : "Cover-i indi yüklə"}
            </button>
          ) : null}
        </div>

        <div className="admin-form-section">
          <h3><ImageIcon size={18} /> Ev qalereyası</h3>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--text-muted)" }}>
            Şəkilləri sürüşdürüb sıralayın. Şəklin üzərinə gəlib onu cover edə bilərsiniz.
          </p>
          {existingImages.length > 0 ? (
            <div className="admin-image-grid" style={{ marginBottom: 12 }}>
              {existingImages.map((img, index) => (
                <div
                  key={img.id}
                  className={`admin-image-card admin-image-card--sortable${draggedImageId === img.id ? " is-dragging" : ""}`}
                  draggable={!imageBusy}
                  onDragStart={(event) => {
                    setDraggedImageId(img.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(img.id));
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    dropExistingImage(img.id);
                  }}
                  onDragEnd={() => setDraggedImageId(null)}
                >
                  <img src={assetUrl(img.url || img.image_path)} alt="" />
                  <span className="admin-image-order-badge">
                    <GripVertical size={13} aria-hidden />
                    {index + 1}
                  </span>
                  <div className="admin-image-hover-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary"
                      disabled={imageBusy}
                      onClick={() => void handleSetCover(img.id)}
                    >
                      <Star size={14} aria-hidden />
                      Cover et
                    </button>
                  </div>
                  <div className="admin-image-card-actions">
                    <button
                      type="button"
                      className="admin-btn admin-icon-btn"
                      title="Sola keçir"
                      aria-label={`${index + 1}-ci şəkli sola keçir`}
                      disabled={imageBusy || index === 0}
                      onClick={() => moveExistingImage(img.id, -1)}
                    >
                      <ChevronLeft size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-icon-btn"
                      title="Sağa keçir"
                      aria-label={`${index + 1}-ci şəkli sağa keçir`}
                      disabled={imageBusy || index === existingImages.length - 1}
                      onClick={() => moveExistingImage(img.id, 1)}
                    >
                      <ChevronRight size={15} aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      disabled={imageBusy}
                      onClick={() => void handleDeleteImage(img.id)}
                    >
                      Sil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Qalereya şəkli yoxdur.</p>
          )}
          <label className="admin-file-pick">
            <span>Qalereya şəkilləri seç / önizlə</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              onChange={(e) => {
                onPickFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
          {pendingImages.length > 0 ? (
            <div ref={previewRef} style={{ marginTop: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 700, color: "var(--primary-dark)" }}>
                Önizləmə ({pendingImages.length}) — hələ yüklənməyib
              </p>
              <div className="admin-image-grid">
                {pendingImages.map((image) => (
                  <div key={image.id} className="admin-image-card admin-image-card--pending">
                    <img src={image.previewUrl} alt={image.file.name} />
                    <span className="admin-image-cover-badge">Yeni</span>
                    <div className="admin-image-card-meta">
                      <span title={image.file.name}>{image.file.name}</span>
                      <small>{image.sizeLabel}</small>
                    </div>
                    <div className="admin-image-card-actions">
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger"
                        onClick={() => removePending(image.id)}
                      >
                        Çıxar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {activeId ? (
                <button
                  type="button"
                  className="admin-btn admin-btn--primary"
                  style={{ marginTop: 12 }}
                  disabled={imageBusy}
                  onClick={() => void handleUploadNow()}
                >
                  {imageBusy ? "Yüklənir..." : `İndi yüklə (${pendingImages.length})`}
                </button>
              ) : (
                <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
                  <b>Yarat</b> düyməsinə basanda şəkillər avtomatik yüklənəcək.
                </p>
              )}
            </div>
          ) : (
            <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
              Hələ şəkil seçilməyib.
            </p>
          )}
        </div>

        <div className="admin-form-section">
          <h3><BedDouble size={18} /> Yataq və qalma məlumatları</h3>
          <div className="admin-form-grid">
            <label>
              1 nəf. yataq
              <input type="number" min={0} placeholder="Sayı daxil edin" value={form.single_beds} onChange={(e) => update("single_beds", e.target.value)} />
            </label>
            <label>
              2 nəf. yataq
              <input type="number" min={0} placeholder="Sayı daxil edin" value={form.double_beds} onChange={(e) => update("double_beds", e.target.value)} />
            </label>
            <label>
              Sofa-bed
              <input type="number" min={0} placeholder="Sayı daxil edin" value={form.sofa_beds} onChange={(e) => update("sofa_beds", e.target.value)} />
            </label>
            <label>
              Hamam
              <input type="number" min={0} placeholder="Sayı daxil edin" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
            </label>
            <label>
              Check-in
              <input value={form.check_in_time} onChange={(e) => update("check_in_time", e.target.value)} />
            </label>
            <label>
              Check-out
              <input value={form.check_out_time} onChange={(e) => update("check_out_time", e.target.value)} />
            </label>
          </div>
        </div>

        <div className="admin-form-section">
          <h3><UserRound size={18} /> Ev sahibi</h3>
          <div className="admin-choice-grid">
            {(propertyId ? (["new", "existing", "admin"] as const) : (["new", "existing"] as const)).map((choice) => (
              <label key={choice} className={`admin-choice-card${form.owner_choice === choice ? " is-selected" : ""}`}>
                <input
                  className="admin-custom-radio"
                  type="radio"
                  name="owner_choice"
                  checked={form.owner_choice === choice}
                  onChange={() => {
                    update("owner_choice", choice);
                    if (choice !== "existing") setOwnerQuery("");
                  }}
                />
                {choice === "admin" ? "Admin / default" : choice === "existing" ? "Mövcud istifadəçi" : "Yeni sahib (telefon ilə)"}
              </label>
            ))}
          </div>
          {!propertyId ? (
            <p className="admin-form-hint" style={{ marginTop: 8 }}>
              Yeni ev üçün sahib adı və telefon mütləqdir — sistem bu nömrə ilə avtomatik owner hesabı yaradır (və ya mövcud hesabı bağlayır).
            </p>
          ) : null}
          {form.owner_choice === "existing" && meta ? (
            <div className="admin-owner-picker">
              <label className="admin-owner-picker__search">
                <Search size={16} aria-hidden="true" />
                <input
                  value={ownerQuery}
                  onChange={(e) => setOwnerQuery(e.target.value)}
                  placeholder="Ad, istifadəçi adı və ya telefon axtar..."
                  autoComplete="off"
                />
                {ownerQuery ? (
                  <button
                    type="button"
                    className="admin-search-clear"
                    aria-label="Axtarışı təmizlə"
                    onClick={() => setOwnerQuery("")}
                  >
                    <X size={14} aria-hidden />
                  </button>
                ) : null}
              </label>
              {selectedOwner ? (
                <div className="admin-owner-picker__selected">
                  Seçilib: <strong>{selectedOwner.full_name || selectedOwner.username}</strong>
                  {selectedOwner.username ? <span>@{selectedOwner.username}</span> : null}
                  {selectedOwner.phone ? <span>{selectedOwner.phone}</span> : null}
                </div>
              ) : null}
              <div className="admin-owner-picker__list" role="listbox" aria-label="İstifadəçi siyahısı">
                {filteredOwners.length === 0 ? (
                  <p className="admin-owner-picker__empty">Uyğun istifadəçi tapılmadı.</p>
                ) : (
                  filteredOwners.map((o) => {
                    const active = form.owner_id === String(o.id);
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="option"
                        aria-selected={active}
                        className={`admin-owner-picker__option${active ? " is-selected" : ""}`}
                        onClick={() => update("owner_id", String(o.id))}
                      >
                        <span className="admin-owner-picker__name">
                          {o.full_name || "Adsız"}
                          {o.username ? <small>@{o.username}</small> : null}
                        </span>
                        <span className="admin-owner-picker__meta">
                          {o.phone || o.owner_login_id || "—"}
                          <em>{o.role === "owner" ? "Sahib" : o.role === "admin" ? "Admin" : "İstifadəçi"}</em>
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : null}
          {form.owner_choice === "new" ? (
            <div className="admin-form-grid" style={{ marginTop: 10 }}>
              <label>
                Ad
                <input value={form.new_owner_name} onChange={(e) => update("new_owner_name", e.target.value)} />
              </label>
              <label>
                Telefon
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.new_owner_phone}
                  onChange={(e) => update("new_owner_phone", sanitizePhoneInput(e.target.value))}
                />
              </label>
              <label>
                Şifrə (boş burax — avtomatik)
                <input
                  type="text"
                  value={form.new_owner_password}
                  onChange={(e) => update("new_owner_password", e.target.value)}
                  placeholder="Minimum 6 simvol"
                  autoComplete="new-password"
                />
              </label>
              <label>
                Şifrə təkrar
                <input
                  type="text"
                  value={form.new_owner_password_confirm}
                  onChange={(e) => update("new_owner_password_confirm", e.target.value)}
                  placeholder="Eyni şifrəni yazın"
                  autoComplete="new-password"
                />
              </label>
            </div>
          ) : null}
        </div>

        {meta ? (
          <div className="admin-form-section">
            <h3><Tags size={18} /> Teqlər</h3>
            <div className="admin-choice-grid admin-choice-grid--compact">
              {meta.tags.map((tag) => (
                <label key={tag} className={`admin-choice-card${form.tags.includes(tag) ? " is-selected" : ""}`}>
                  <input
                    className="admin-custom-checkbox"
                    type="checkbox"
                    checked={form.tags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  {tag}
                </label>
              ))}
            </div>
          </div>
        ) : null}

        <div className="admin-form-section">
          <h3><CircleCheck size={18} /> İmkanlar</h3>
          <div className="admin-choice-grid admin-choice-grid--compact">
            {AMENITIES.map(({ key, label }) => (
              <label key={key} className={`admin-choice-card${form.amenities[key] ? " is-selected" : ""}`}>
                <input
                  className="admin-custom-checkbox"
                  type="checkbox"
                  checked={form.amenities[key] || false}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      amenities: { ...prev.amenities, [key]: e.target.checked },
                    }))
                  }
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="admin-property-form-actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving || imageBusy}>
            {saving
              ? "Saxlanılır..."
              : imageBusy
                ? "Şəkillər yüklənir..."
                : activeId
                  ? "Yenilə"
                  : "Yarat"}
          </button>
          <button type="button" className="admin-btn" onClick={onCancel}>
            Ləğv et
          </button>
        </div>
      </form>
      {confirmModal}
    </section>
  );
}
