"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarRange, Home, MapPin, Save } from "lucide-react";
import { MapLocationPicker } from "@/components/map/MapLocationPicker";
import { BusyDaysPicker } from "@/components/property/BusyDaysPicker";
import { api } from "@/lib/api";
import { GABALA_LOCATIONS, resolveLocationOptions } from "@/lib/locations";
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
  tags: [],
  amenities: Object.fromEntries(AMENITIES.map((a) => [a.key, false])),
});

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingBlocked, setSavingBlocked] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?return=/my-houses/${propertyId}/edit`);
      return;
    }
    if (user.role !== "owner" && user.role !== "admin") {
      setError("Bu səhifə yalnız ev sahibləri üçündür.");
      setLoading(false);
      return;
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
        tags: p.tags_list || [],
        amenities: Object.fromEntries(
          AMENITIES.map((a) => [a.key, Boolean((p as Record<string, unknown>)[a.key])]),
        ),
      });
      setBlockedDates(p.blocked_dates || []);
      setBookedRanges(
        (p.occupied_ranges || []).filter((r) => (r.source || "booking") === "booking"),
      );
      setLoading(false);
    })();
  }, [authLoading, user, router, propertyId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      tags: form.tags,
      ...form.amenities,
    });
    setSaving(false);
    if (!res.success) {
      setError(res.error || "Saxlanmadı");
      return;
    }
    setNotice(res.data?.message || "Məlumatlar yeniləndi");
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
            <p>Məlumatları, xəritə məkanını və dolu günləri buradan yenilə.</p>
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
            <button type="submit" className="auth-btn primary" disabled={saving}>
              <Save size={16} />
              {saving ? "Saxlanılır..." : "Məlumatları saxla"}
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
