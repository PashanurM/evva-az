"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Heart,
  Home,
  ImageIcon,
  MapPin,
  Save,
  Star,
} from "lucide-react";
import { MapLocationPicker } from "@/components/map/MapLocationPicker";
import { BusyDaysPicker } from "@/components/property/BusyDaysPicker";
import { api, assetUrl, type OwnerPropertyImage } from "@/lib/api";
import { consumePostLogoutRedirect, markAdminOwnerMode } from "@/lib/auth-redirect";
import { GABALA_LOCATIONS, resolveLocationOptions } from "@/lib/locations";
import type { PropertyRatingSummary, PropertyReview } from "@/lib/types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "@/providers/LocaleProvider";

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

type FormState = {
  title: string;
  location: string;
  price: string;
  capacity: string;
  rooms: string;
  bathrooms: string;
  description: string;
  single_beds: string;
  double_beds: string;
  sofa_beds: string;
  minimum_nights: string;
  check_in_time: string;
  check_out_time: string;
  map_address: string;
  latitude: string;
  longitude: string;
  house_rules: string;
  cancellation_policy: string;
  is_active: boolean;
  is_featured: boolean;
  tags: string[];
  amenities: Record<string, boolean>;
};

const emptyForm = (): FormState => ({
  title: "",
  location: "",
  price: "",
  capacity: "",
  rooms: "",
  bathrooms: "",
  description: "",
  single_beds: "",
  double_beds: "",
  sofa_beds: "",
  minimum_nights: "1",
  check_in_time: "15:00",
  check_out_time: "12:00",
  map_address: "",
  latitude: "",
  longitude: "",
  house_rules: "",
  cancellation_policy: "",
  is_active: true,
  is_featured: false,
  tags: [],
  amenities: Object.fromEntries(AMENITIES.map((a) => [a.key, false])),
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
  sizeLabel: string;
};

export function OwnerPropertyEditClient({ propertyId }: { propertyId: number }) {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [tagOptions, setTagOptions] = useState<string[]>([]);
  const [locationOptions, setLocationOptions] = useState<string[]>([...GABALA_LOCATIONS]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedRanges, setBookedRanges] = useState<
    Array<{ check_in: string; check_out: string; source?: string }>
  >([]);
  const [coverImage, setCoverImage] = useState<OwnerPropertyImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<OwnerPropertyImage[]>([]);
  const [pendingCover, setPendingCover] = useState<PendingImage | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [ratingSummary, setRatingSummary] = useState<PropertyRatingSummary | null>(null);
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(
        consumePostLogoutRedirect(`/login?return=/my-houses/${propertyId}/edit`),
      );
      return;
    }
    if (user.role !== "owner" && user.role !== "admin") {
      setError("Bu səhifə yalnız ev sahibləri üçündür.");
      setLoading(false);
      return;
    }
    if (user.can_switch_owner || user.base_role === "admin") {
      markAdminOwnerMode(true);
    }

    void (async () => {
      setLoading(true);
      setError("");
      const [res, configRes] = await Promise.all([
        api.getOwnerProperty(propertyId),
        api.getSiteConfig(),
      ]);
      if (!res.success || !res.data?.property) {
        setError(res.error || "Ev yüklənmədi");
        setLoading(false);
        return;
      }
      const p = res.data.property;
      setTagOptions(res.data.tags || []);
      setLocationOptions(
        resolveLocationOptions([
          ...(configRes.data?.locations || []),
          p.location || "",
        ]),
      );
      setForm({
        title: p.title || "",
        location: p.location || "",
        price: p.price ? String(p.price) : "",
        capacity: p.capacity ? String(p.capacity) : "",
        rooms: p.rooms ? String(p.rooms) : "",
        bathrooms: p.bathrooms ? String(p.bathrooms) : "",
        description: p.description || "",
        single_beds: p.single_beds ? String(p.single_beds) : "",
        double_beds: p.double_beds ? String(p.double_beds) : "",
        sofa_beds: p.sofa_beds ? String(p.sofa_beds) : "",
        minimum_nights: String(p.minimum_nights || 1),
        check_in_time: p.check_in_time || "15:00",
        check_out_time: p.check_out_time || "12:00",
        map_address: p.map_address || "",
        latitude: p.latitude != null ? String(p.latitude) : "",
        longitude: p.longitude != null ? String(p.longitude) : "",
        house_rules: p.house_rules || "",
        cancellation_policy: p.cancellation_policy || "",
        is_active: Boolean(p.is_active),
        is_featured: Boolean(p.is_featured),
        tags: p.tags_list || [],
        amenities: Object.fromEntries(
          AMENITIES.map((a) => [a.key, Boolean((p as Record<string, unknown>)[a.key])]),
        ),
      });
      setCoverImage(
        p.cover_image ||
          (p.cover_url
            ? {
                id: 0,
                image_path: p.cover_path || "",
                url: p.cover_url,
                is_cover: true,
              }
            : null),
      );
      setGalleryImages(p.images || []);
      setBlockedDates(p.blocked_dates || []);
      setBookedRanges(
        (p.occupied_ranges || []).filter((r) => (r.source || "booking") === "booking"),
      );
      setRatingSummary(p.rating_summary || null);
      setReviews(p.reviews || []);
      setFavoriteCount(Number(p.favorite_count || 0));
      setLoading(false);
    })();
  }, [authLoading, user, router, propertyId]);

  useEffect(() => {
    return () => {
      if (pendingCover) URL.revokeObjectURL(pendingCover.previewUrl);
      pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function applyImagePayload(data: {
    cover_image?: OwnerPropertyImage | null;
    images?: OwnerPropertyImage[];
    cover_url?: string;
    cover_path?: string;
  }) {
    setCoverImage(
      data.cover_image ||
        (data.cover_url
          ? {
              id: 0,
              image_path: data.cover_path || "",
              url: data.cover_url,
              is_cover: true,
            }
          : null),
    );
    setGalleryImages(data.images || []);
  }

  function onPickCover(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (pendingCover) URL.revokeObjectURL(pendingCover.previewUrl);
    setPendingCover({
      id: `cover-${Date.now()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      sizeLabel: formatFileSize(file.size),
    });
    setNotice("Yeni cover şəkli seçildi. Yükləmək üçün düyməyə basın.");
  }

  function onPickGallery(files: FileList | null) {
    if (!files?.length) return;
    const next = Array.from(files).map((file, index) => ({
      id: `pending-${Date.now()}-${index}`,
      file,
      previewUrl: URL.createObjectURL(file),
      sizeLabel: formatFileSize(file.size),
    }));
    setPendingImages((prev) => [...prev, ...next]);
    setNotice(`${next.length} şəkil önizləməyə əlavə olundu.`);
  }

  function removePending(id: string) {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  }

  async function handleCoverUpload() {
    if (!pendingCover) return;
    setImageBusy(true);
    setError("");
    setNotice("");
    const res = await api.uploadOwnerPropertyCover(propertyId, pendingCover.file);
    setImageBusy(false);
    if (!res.success || !res.data) {
      setError(res.error || "Cover yüklənmədi");
      return;
    }
    URL.revokeObjectURL(pendingCover.previewUrl);
    setPendingCover(null);
    applyImagePayload(res.data);
    setNotice(res.data.message || "Cover yeniləndi");
  }

  async function handleGalleryUpload() {
    if (pendingImages.length === 0) return;
    setImageBusy(true);
    setError("");
    setNotice("");
    const files = pendingImages.map((img) => img.file);
    const res = await api.uploadOwnerPropertyImages(propertyId, files);
    setImageBusy(false);
    if (!res.success || !res.data) {
      setError(res.error || "Şəkillər yüklənmədi");
      return;
    }
    pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setPendingImages([]);
    applyImagePayload(res.data);
    setNotice(res.data.message || "Şəkillər yükləndi");
  }

  async function handleDeleteImage(imageId: number) {
    if (imageId <= 0) {
      setError("Bu cover köhnə yolla saxlanıb. Yeni cover yükləyin və ya qalereyadan seçin.");
      return;
    }
    if (!window.confirm("Bu şəkli silmək istəyirsiniz?")) return;
    setImageBusy(true);
    setError("");
    setNotice("");
    const res = await api.deleteOwnerPropertyImage(propertyId, imageId);
    setImageBusy(false);
    if (!res.success || !res.data) {
      setError(res.error || "Şəkil silinmədi");
      return;
    }
    applyImagePayload(res.data);
    setNotice(res.data.message || "Şəkil silindi");
  }

  async function handleSetCover(imageId: number) {
    setImageBusy(true);
    setError("");
    setNotice("");
    const res = await api.setOwnerPropertyCover(propertyId, imageId);
    setImageBusy(false);
    if (!res.success || !res.data) {
      setError(res.error || "Cover təyin olunmadı");
      return;
    }
    applyImagePayload(res.data);
    setNotice(res.data.message || "Cover yeniləndi");
  }

  async function reorderGallery(nextImages: OwnerPropertyImage[]) {
    const previous = galleryImages;
    setGalleryImages(nextImages);
    setImageBusy(true);
    setError("");
    const res = await api.reorderOwnerPropertyImages(
      propertyId,
      nextImages.map((img) => img.id),
    );
    setImageBusy(false);
    if (!res.success || !res.data) {
      setGalleryImages(previous);
      setError(res.error || "Sıra saxlanmadı");
      return;
    }
    applyImagePayload(res.data);
  }

  function moveGalleryImage(imageId: number, direction: -1 | 1) {
    const index = galleryImages.findIndex((img) => img.id === imageId);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= galleryImages.length) return;
    const next = [...galleryImages];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    void reorderGallery(next);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.location.trim()) {
      setError("Yaxınlıq / məkan seçilməlidir");
      return;
    }
    if (!Number(form.price) || !Number(form.capacity) || !Number(form.rooms)) {
      setError("Qiymət, qonaq sayı və otaq düzgün doldurulmalıdır");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    const res = await api.updateOwnerProperty(propertyId, {
      title: form.title.trim(),
      location: form.location.trim(),
      price: Number(form.price),
      capacity: Number(form.capacity),
      rooms: Number(form.rooms),
      bathrooms: Number(form.bathrooms || 0),
      description: form.description.trim(),
      single_beds: Number(form.single_beds || 0),
      double_beds: Number(form.double_beds || 0),
      sofa_beds: Number(form.sofa_beds || 0),
      minimum_nights: Number(form.minimum_nights || 1),
      check_in_time: form.check_in_time,
      check_out_time: form.check_out_time,
      map_address: form.map_address,
      latitude: form.latitude || null,
      longitude: form.longitude || null,
      house_rules: form.house_rules,
      cancellation_policy: form.cancellation_policy,
      is_active: form.is_active,
      is_featured: form.is_featured,
      tags: form.tags,
      ...form.amenities,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error || "Saxlanmadı");
      return;
    }
    setNotice(res.data?.message || "Məlumatlar yeniləndi");

    if (pendingCover || pendingImages.length > 0) {
      setImageBusy(true);
      let mediaOk = true;
      if (pendingCover) {
        const coverRes = await api.uploadOwnerPropertyCover(propertyId, pendingCover.file);
        if (!coverRes.success || !coverRes.data) {
          mediaOk = false;
          setError(coverRes.error || "Cover yüklənmədi");
        } else {
          URL.revokeObjectURL(pendingCover.previewUrl);
          setPendingCover(null);
          applyImagePayload(coverRes.data);
        }
      }
      if (mediaOk && pendingImages.length > 0) {
        const galleryRes = await api.uploadOwnerPropertyImages(
          propertyId,
          pendingImages.map((img) => img.file),
        );
        if (!galleryRes.success || !galleryRes.data) {
          mediaOk = false;
          setError(galleryRes.error || "Şəkillər yüklənmədi");
        } else {
          pendingImages.forEach((img) => URL.revokeObjectURL(img.previewUrl));
          setPendingImages([]);
          applyImagePayload(galleryRes.data);
        }
      }
      setImageBusy(false);
      if (mediaOk) {
        setNotice("Məlumatlar və şəkillər yeniləndi");
      }
    }
  }

  async function handleSaveBlocked() {
    setSavingBlocked(true);
    setError("");
    setNotice("");
    const res = await api.saveOwnerBlockedDates(propertyId, blockedDates);
    setSavingBlocked(false);
    if (!res.success) {
      setError(res.error || "Dolu günlər saxlanmadı");
      return;
    }
    setBlockedDates(res.data?.items || blockedDates);
    setNotice(res.data?.message || "Dolu günlər yeniləndi");
  }

  if (authLoading || loading) {
    return (
      <section className="page-hero">
        <div className="container">
          <p>{t("common.wait")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-hero owner-edit-page">
      <div className="container">
        <div className="owner-edit-head">
          <Link href="/my-houses" className="auth-btn">
            <ArrowLeft size={16} /> Panelə qayıt
          </Link>
          <div>
            <span className="section-kicker">Ev sahibi</span>
            <h1>Evi redaktə et</h1>
            <p>Məlumatları, şəkilləri, xəritə məkanını və dolu günləri buradan yenilə.</p>
          </div>
        </div>

        {error ? (
          <div className="auth-notice auth-notice-error" role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="auth-notice auth-notice-success" role="status">
            {notice}
          </div>
        ) : null}

        <div className="owner-edit-section" style={{ marginBottom: 18 }}>
          <h2>
            <Star size={18} /> Reytinq və sevimlilər
          </h2>
          <div className="owner-house-meta" style={{ marginBottom: 10 }}>
            <span>
              <Heart size={13} /> {favoriteCount} sevimli
            </span>
            <span>
              <Star size={13} fill={Number(ratingSummary?.rating_count || 0) > 0 ? "currentColor" : "none"} />
              {Number(ratingSummary?.rating_count || 0) > 0
                ? `${Number(ratingSummary?.avg_rating || 0).toFixed(1)} / 10 · ${ratingSummary?.rating_count} rəy`
                : "Hələ reytinq yoxdur"}
            </span>
          </div>
          {ratingSummary && Number(ratingSummary.rating_count || 0) > 0 ? (
            <div className="owner-house-ratings">
              <span>Təmizlik {Number(ratingSummary.cleanliness_avg || 0).toFixed(1)}</span>
              <span>Yerləşmə {Number(ratingSummary.location_avg || 0).toFixed(1)}</span>
              <span>Rahatlıq {Number(ratingSummary.comfort_avg || 0).toFixed(1)}</span>
              <span>Ev sahibi {Number(ratingSummary.homeowner_avg || 0).toFixed(1)}</span>
            </div>
          ) : null}
          {reviews.length > 0 ? (
            <div className="property-reviews-list" style={{ marginTop: 8 }}>
              <h3 style={{ fontSize: 15, margin: "4px 0 0" }}>Reytinq tarixçəsi</h3>
              {reviews.map((review, index) => (
                <article
                  key={`${review.username}-${review.created_at}-${index}`}
                  className="property-review-card"
                >
                  <div className="property-review-head">
                    <strong>{review.full_name || review.username || "Qonaq"}</strong>
                    <span>{Number(review.rating || 0).toFixed(1)}/10</span>
                  </div>
                  {review.comment ? <p>{review.comment}</p> : null}
                  <div className="property-review-cats">
                    <span>Təmizlik: {review.cleanliness_rating}</span>
                    <span>Yerləşmə: {review.location_rating}</span>
                    <span>Rahatlıq: {review.comfort_rating}</span>
                    <span>Ev sahibi: {review.homeowner_rating}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="owner-edit-hint" style={{ marginTop: 8 }}>
              Bu ev üçün hələ rəy/rating tarixçəsi yoxdur.
            </p>
          )}
        </div>

        <form className="owner-edit-form" onSubmit={(e) => void handleSave(e)}>
          <div className="owner-edit-section">
            <h2>
              <Home size={18} /> Əsas məlumatlar
            </h2>
            <div className="owner-edit-grid">
              <label>
                Başlıq *
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  required
                />
              </label>
              <label>
                Yaxınlıq / məkan *
                <select
                  value={form.location}
                  onChange={(e) => update("location", e.target.value)}
                  required
                >
                  <option value="">Məkan seçin</option>
                  {locationOptions.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Qiymət (₼) *
                <input
                  type="number"
                  min={1}
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  required
                />
              </label>
              <label>
                Maks. qonaq *
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => update("capacity", e.target.value)}
                  required
                />
              </label>
              <label>
                Otaq *
                <input
                  type="number"
                  min={1}
                  value={form.rooms}
                  onChange={(e) => update("rooms", e.target.value)}
                  required
                />
              </label>
              <label>
                Hamam
                <input
                  type="number"
                  min={0}
                  value={form.bathrooms}
                  onChange={(e) => update("bathrooms", e.target.value)}
                />
              </label>
              <label>
                Minimum gecə
                <input
                  type="number"
                  min={1}
                  value={form.minimum_nights}
                  onChange={(e) => update("minimum_nights", e.target.value)}
                />
              </label>
              <label>
                Giriş saatı
                <input
                  value={form.check_in_time}
                  onChange={(e) => update("check_in_time", e.target.value)}
                />
              </label>
              <label>
                Çıxış saatı
                <input
                  value={form.check_out_time}
                  onChange={(e) => update("check_out_time", e.target.value)}
                />
              </label>
            </div>

            <label className="owner-edit-full">
              Təsvir *
              <textarea
                rows={5}
                maxLength={2000}
                value={form.description}
                onChange={(e) => update("description", e.target.value.slice(0, 2000))}
                required
              />
            </label>

            <label className="owner-edit-switch">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => update("is_active", e.target.checked)}
              />
              <span>Ev aktiv olsun (saytda görünsün)</span>
            </label>
            <label className="owner-edit-switch">
              <input
                type="checkbox"
                checked={form.is_featured}
                onChange={(e) => update("is_featured", e.target.checked)}
              />
              <span>Premium / seçilmiş ev et</span>
            </label>
          </div>

          <div className="owner-edit-section">
            <h2>
              <ImageIcon size={18} /> Cover şəkli
            </h2>
            <p className="owner-edit-hint">Kartlarda və siyahıda görünəcək əsas şəkil.</p>
            {coverImage?.url || coverImage?.image_path ? (
              <div className="owner-image-grid">
                <div className="owner-image-card is-cover">
                  <img
                    src={assetUrl(coverImage.url || coverImage.image_path)}
                    alt="Cover"
                  />
                  <span className="owner-image-badge">Cover</span>
                  {coverImage.id > 0 ? (
                    <div className="owner-image-actions">
                      <button
                        type="button"
                        className="auth-btn"
                        disabled={imageBusy}
                        onClick={() => void handleDeleteImage(coverImage.id)}
                      >
                        Sil
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="owner-edit-hint">Cover şəkli yoxdur.</p>
            )}
            <label className="owner-file-pick">
              <span>{coverImage ? "Cover-i dəyiş" : "Cover seç"}</span>
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
              <div className="owner-image-grid" style={{ marginTop: 12 }}>
                <div className="owner-image-card is-cover is-pending">
                  <img src={pendingCover.previewUrl} alt={pendingCover.file.name} />
                  <span className="owner-image-badge">Yeni cover</span>
                  <div className="owner-image-meta">
                    <span title={pendingCover.file.name}>{pendingCover.file.name}</span>
                    <small>{pendingCover.sizeLabel}</small>
                  </div>
                  <div className="owner-image-actions">
                    <button
                      type="button"
                      className="auth-btn"
                      onClick={() => {
                        URL.revokeObjectURL(pendingCover.previewUrl);
                        setPendingCover(null);
                      }}
                    >
                      Çıxar
                    </button>
                    <button
                      type="button"
                      className="auth-btn primary"
                      disabled={imageBusy}
                      onClick={() => void handleCoverUpload()}
                    >
                      {imageBusy ? "Yüklənir..." : "İndi yüklə"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="owner-edit-section">
            <h2>
              <ImageIcon size={18} /> Ev qalereyası
            </h2>
            <p className="owner-edit-hint">
              Şəkilləri yükləyin, silin və ya cover edin. Ox düymələri ilə sıranı dəyişin.
            </p>
            {galleryImages.length > 0 ? (
              <div className="owner-image-grid">
                {galleryImages.map((img, index) => (
                  <div key={img.id} className="owner-image-card">
                    <img src={assetUrl(img.url || img.image_path)} alt="" />
                    <span className="owner-image-order">{index + 1}</span>
                    <div className="owner-image-hover">
                      <button
                        type="button"
                        className="auth-btn primary"
                        disabled={imageBusy}
                        onClick={() => void handleSetCover(img.id)}
                      >
                        <Star size={14} aria-hidden />
                        Cover et
                      </button>
                    </div>
                    <div className="owner-image-actions">
                      <button
                        type="button"
                        className="auth-btn owner-image-icon-btn"
                        disabled={imageBusy || index === 0}
                        aria-label="Sola keçir"
                        onClick={() => moveGalleryImage(img.id, -1)}
                      >
                        <ChevronLeft size={15} />
                      </button>
                      <button
                        type="button"
                        className="auth-btn owner-image-icon-btn"
                        disabled={imageBusy || index === galleryImages.length - 1}
                        aria-label="Sağa keçir"
                        onClick={() => moveGalleryImage(img.id, 1)}
                      >
                        <ChevronRight size={15} />
                      </button>
                      <button
                        type="button"
                        className="auth-btn"
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
              <p className="owner-edit-hint">Qalereya şəkli yoxdur.</p>
            )}
            <label className="owner-file-pick">
              <span>Qalereya şəkilləri seç</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                onChange={(e) => {
                  onPickGallery(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {pendingImages.length > 0 ? (
              <div style={{ marginTop: 14 }}>
                <p className="owner-edit-hint" style={{ fontWeight: 700 }}>
                  Önizləmə ({pendingImages.length}) — hələ yüklənməyib
                </p>
                <div className="owner-image-grid">
                  {pendingImages.map((image) => (
                    <div key={image.id} className="owner-image-card is-pending">
                      <img src={image.previewUrl} alt={image.file.name} />
                      <span className="owner-image-badge">Yeni</span>
                      <div className="owner-image-meta">
                        <span title={image.file.name}>{image.file.name}</span>
                        <small>{image.sizeLabel}</small>
                      </div>
                      <div className="owner-image-actions">
                        <button
                          type="button"
                          className="auth-btn"
                          onClick={() => removePending(image.id)}
                        >
                          Çıxar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="auth-btn primary"
                  style={{ marginTop: 12 }}
                  disabled={imageBusy}
                  onClick={() => void handleGalleryUpload()}
                >
                  {imageBusy ? "Yüklənir..." : "Şəkilləri indi yüklə"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="owner-edit-section">
            <h2>
              <MapPin size={18} /> Xəritə / dəqiq məkan
            </h2>
            <MapLocationPicker
              latitude={form.latitude}
              longitude={form.longitude}
              mapAddress={form.map_address}
              onChange={(coords) =>
                setForm((prev) => ({
                  ...prev,
                  latitude: coords.latitude,
                  longitude: coords.longitude,
                  map_address: coords.mapAddress ?? prev.map_address,
                }))
              }
            />
          </div>

          <div className="owner-edit-section">
            <h2>Yataq və imkanlar</h2>
            <div className="owner-edit-grid">
              <label>
                Tək yataq
                <input
                  type="number"
                  min={0}
                  value={form.single_beds}
                  onChange={(e) => update("single_beds", e.target.value)}
                />
              </label>
              <label>
                İki nəfərlik yataq
                <input
                  type="number"
                  min={0}
                  value={form.double_beds}
                  onChange={(e) => update("double_beds", e.target.value)}
                />
              </label>
              <label>
                Divan yataq
                <input
                  type="number"
                  min={0}
                  value={form.sofa_beds}
                  onChange={(e) => update("sofa_beds", e.target.value)}
                />
              </label>
            </div>
            <div className="owner-edit-amenities">
              {AMENITIES.map((item) => (
                <label key={item.key} className="owner-edit-chip">
                  <input
                    type="checkbox"
                    checked={Boolean(form.amenities[item.key])}
                    onChange={(e) =>
                      update("amenities", {
                        ...form.amenities,
                        [item.key]: e.target.checked,
                      })
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
            {tagOptions.length > 0 ? (
              <div className="owner-edit-amenities" style={{ marginTop: 12 }}>
                {tagOptions.map((tag) => (
                  <label key={tag} className="owner-edit-chip">
                    <input
                      type="checkbox"
                      checked={form.tags.includes(tag)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          update("tags", [...form.tags, tag]);
                        } else {
                          update(
                            "tags",
                            form.tags.filter((t) => t !== tag),
                          );
                        }
                      }}
                    />
                    <span>{tag}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          <div className="owner-edit-section">
            <h2>Qaydalar</h2>
            <label className="owner-edit-full">
              Ev qaydaları
              <textarea
                rows={3}
                maxLength={2000}
                value={form.house_rules}
                onChange={(e) => update("house_rules", e.target.value.slice(0, 2000))}
              />
            </label>
            <label className="owner-edit-full">
              Ləğv qaydaları
              <textarea
                rows={3}
                maxLength={2000}
                value={form.cancellation_policy}
                onChange={(e) =>
                  update("cancellation_policy", e.target.value.slice(0, 2000))
                }
              />
            </label>
          </div>

          <div className="owner-edit-actions">
            <button
              type="submit"
              className="auth-btn primary"
              disabled={saving || imageBusy}
            >
              <Save size={16} />
              {saving || imageBusy ? "Saxlanılır..." : "Hamısını saxla"}
            </button>
            <Link href={`/property/${propertyId}`} className="auth-btn">
              Saytda bax
            </Link>
          </div>
        </form>

        <div className="owner-edit-section" style={{ marginTop: 24 }}>
          <h2>
            <CalendarRange size={18} /> Dolu günləri seç
          </h2>
          <p style={{ color: "var(--text-secondary)", marginTop: 0 }}>
            Özünüz bağlamaq istədiyiniz günləri seçin. Rezerv olunmuş günlər avtomatik dolu
            sayılır və dəyişdirilə bilməz.
          </p>
          <BusyDaysPicker
            blockedDates={blockedDates}
            bookedRanges={bookedRanges}
            onChange={setBlockedDates}
          />
          <div className="owner-edit-actions">
            <button
              type="button"
              className="auth-btn primary"
              disabled={savingBlocked}
              onClick={() => void handleSaveBlocked()}
            >
              <Save size={16} />
              {savingBlocked ? "Saxlanılır..." : "Dolu günləri saxla"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
