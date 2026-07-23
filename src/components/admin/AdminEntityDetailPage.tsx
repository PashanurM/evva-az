"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Baby,
  Banknote,
  Bath,
  BedDouble,
  Building2,
  CalendarCheck,
  Car,
  CircleCheck,
  CircleX,
  Clock,
  CookingPot,
  Eye,
  Flame,
  Home,
  MapPin,
  PawPrint,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Snowflake,
  Star,
  Tags,
  UserRound,
  Users,
  UtensilsCrossed,
  Waves,
  Wifi,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  adminApi,
  type AdminDetailResource,
  type AdminPropertyDetail,
} from "@/lib/admin-api";
import { assetUrl } from "@/lib/assets";
import { isPhoneFieldKey, sanitizePhoneInput } from "@/lib/phone";
import { useAdmin } from "@/providers/AdminProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPropertyForm } from "@/components/admin/AdminPropertyForm";
import { AdminModuleForm } from "@/components/admin/AdminModuleForm";
import { BusyDaysPicker } from "@/components/property/BusyDaysPicker";

type FieldType = "text" | "number" | "date" | "textarea" | "boolean" | "select";

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  options?: Array<{ value: string; label: string }>;
};

const RESOURCE_META: Record<
  AdminDetailResource,
  { title: string; singular: string; back: string; fields: FieldConfig[] }
> = {
  properties: { title: "Mülk məlumatları", singular: "Mülk", back: "/admin/properties", fields: [] },
  reservations: {
    title: "Rezervasiya məlumatları",
    singular: "Rezervasiya",
    back: "/admin/reservations",
    fields: [
      { key: "guest_name", label: "Qonaq adı" },
      { key: "guest_phone", label: "Qonaq telefonu" },
      { key: "guest_count", label: "Qonaq sayı", type: "number" },
      { key: "check_in", label: "Giriş tarixi", type: "date" },
      { key: "check_out", label: "Çıxış tarixi", type: "date" },
      { key: "note", label: "Qeyd", type: "textarea" },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "pending", label: "Gözləyən" },
          { value: "payment_pending", label: "Ödəniş gözləyir" },
          { value: "approved", label: "Təsdiqlənib" },
          { value: "rejected", label: "Rədd edilib" },
          { value: "cancelled", label: "Ləğv edilib" },
        ],
      },
      {
        key: "payment_status",
        label: "Ödəniş statusu",
        type: "select",
        options: [
          { value: "none", label: "Yoxdur" },
          { value: "awaiting_site_fee", label: "Platforma ödənişi gözləyir" },
          { value: "site_fee_paid", label: "Platforma ödənişi edilib" },
          { value: "cancelled", label: "Ləğv edilib" },
        ],
      },
      { key: "platform_fee_per_night", label: "Gecəlik platforma haqqı", type: "number" },
      { key: "platform_fee_total", label: "Ümumi platforma haqqı", type: "number" },
      { key: "admin_payment_note", label: "Admin ödəniş qeydi", type: "textarea" },
      { key: "owner_cancel_locked", label: "Sahib üçün ləğv kilidi", type: "boolean" },
    ],
  },
  restaurants: {
    title: "Restoran məlumatları",
    singular: "Restoran",
    back: "/admin/restaurants",
    fields: [
      { key: "name", label: "Ad" },
      { key: "short_description", label: "Qısa təsvir" },
      { key: "description", label: "Təsvir", type: "textarea" },
      { key: "location", label: "Məkan" },
      { key: "address", label: "Ünvan" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "phone", label: "Telefon" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "opening_hours", label: "İş saatları" },
      { key: "cuisine_tags", label: "Mətbəx teqləri" },
      { key: "local_foods", label: "Yerli yeməklər", type: "textarea" },
      { key: "foreign_foods", label: "Xarici yeməklər", type: "textarea" },
      { key: "desserts", label: "Desertlər", type: "textarea" },
      { key: "drinks", label: "İçkilər", type: "textarea" },
      { key: "average_price", label: "Orta qiymət", type: "number" },
      { key: "discount_text", label: "Endirim mətni" },
      { key: "is_featured", label: "Premium", type: "boolean" },
      { key: "is_active", label: "Aktiv", type: "boolean" },
    ],
  },
  places: {
    title: "Məkan məlumatları",
    singular: "Məkan",
    back: "/admin/places",
    fields: [
      { key: "title", label: "Ad" },
      { key: "short_description", label: "Qısa təsvir" },
      { key: "description", label: "Təsvir", type: "textarea" },
      { key: "category", label: "Kateqoriya" },
      { key: "location", label: "Məkan" },
      { key: "address", label: "Ünvan" },
      { key: "latitude", label: "Latitude", type: "number" },
      { key: "longitude", label: "Longitude", type: "number" },
      { key: "entry_price", label: "Giriş qiyməti", type: "number" },
      { key: "working_hours", label: "İş saatları" },
      { key: "phone", label: "Telefon" },
      { key: "tips", label: "Məsləhətlər", type: "textarea" },
      { key: "is_featured", label: "Premium", type: "boolean" },
      { key: "is_active", label: "Aktiv", type: "boolean" },
    ],
  },
  payments: {
    title: "Ödəniş hesabı məlumatları",
    singular: "Ödəniş hesabı",
    back: "/admin/payments",
    fields: [
      { key: "account_title", label: "Başlıq" },
      { key: "bank_name", label: "Bank" },
      { key: "card_holder", label: "Kart sahibi" },
      { key: "card_number", label: "Kart nömrəsi" },
      { key: "iban", label: "IBAN" },
      { key: "phone", label: "Telefon" },
      { key: "whatsapp", label: "WhatsApp" },
      { key: "color_theme", label: "Rəng mövzusu" },
      { key: "sort_order", label: "Sıralama", type: "number" },
      { key: "is_active", label: "Aktiv", type: "boolean" },
    ],
  },
  users: {
    title: "İstifadəçi məlumatları",
    singular: "İstifadəçi",
    back: "/admin/users",
    fields: [
      { key: "full_name", label: "Ad və soyad" },
      { key: "username", label: "İstifadəçi adı" },
      { key: "phone", label: "Telefon" },
      {
        key: "role",
        label: "Rol",
        type: "select",
        options: [
          { value: "user", label: "İstifadəçi" },
          { value: "owner", label: "Sahib" },
          { value: "admin", label: "Admin" },
        ],
      },
      { key: "owner_login_id", label: "Sahib giriş ID-si" },
      { key: "wallet_balance", label: "Balans", type: "number" },
      { key: "owner_bio", label: "Sahib haqqında", type: "textarea" },
      { key: "is_verified", label: "Təsdiqlənib", type: "boolean" },
      { key: "is_approved", label: "İcazəlidir", type: "boolean" },
      { key: "can_switch_owner", label: "Sahib rejiminə keçə bilər", type: "boolean" },
    ],
  },
  messages: {
    title: "Söhbət məlumatları",
    singular: "Söhbət",
    back: "/admin/messages",
    fields: [
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { value: "open", label: "Açıq" },
          { value: "closed", label: "Bağlı" },
        ],
      },
    ],
  },
};

const FIELD_LABELS: Record<string, string> = {
  id: "ID",
  property_id: "Mülk ID",
  property_title: "Mülk",
  property_location: "Mülkün məkanı",
  guest_user_name: "Qeydiyyatlı qonaq",
  guest_username: "Qonaq istifadəçi adı",
  owner_name: "Sahib",
  owner_phone: "Sahib telefonu",
  created_at: "Yaradılma tarixi",
  updated_at: "Yenilənmə tarixi",
  menu_count: "Menyu sayı",
  manager_names: "Menecerlər",
  property_count: "Mülk sayı",
  booking_count: "Rezervasiya sayı",
  last_message_at: "Son mesaj tarixi",
};

function asBoolean(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Bəli" : "Xeyr";
  if (typeof value === "object") return "";
  return String(value);
}

function PropertyMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="admin-property-metric">
      <span className="admin-property-metric-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function PropertyDetailView({ entity }: { entity: Record<string, unknown> }) {
  const propertyId = Number(entity.id) || 0;
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookedRanges, setBookedRanges] = useState<
    Array<{ check_in: string; check_out: string; source?: string }>
  >([]);
  const [calendarLoading, setCalendarLoading] = useState(propertyId > 0);
  const [savingBlocked, setSavingBlocked] = useState(false);

  useEffect(() => {
    if (propertyId <= 0) {
      setCalendarLoading(false);
      return;
    }
    let active = true;
    setCalendarLoading(true);
    void adminApi.getPropertyBlockedDates(propertyId).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setBlockedDates(res.data.items || []);
        setBookedRanges(
          (res.data.occupied_ranges || []).filter(
            (range) => (range.source || "booking") === "booking",
          ),
        );
      } else {
        setBlockedDates([]);
        setBookedRanges([]);
      }
      setCalendarLoading(false);
    });
    return () => {
      active = false;
    };
  }, [propertyId]);

  async function handleSaveBlocked() {
    if (propertyId <= 0) return;
    setSavingBlocked(true);
    const res = await adminApi.savePropertyBlockedDates(propertyId, blockedDates);
    setSavingBlocked(false);
    if (!res.success) {
      toast.error(res.error || "Dolu günlər saxlanmadı");
      return;
    }
    setBlockedDates(res.data?.items || blockedDates);
    toast.success(res.data?.message || "Dolu günlər yeniləndi");
  }

  const amenities = [
    { key: "wifi", label: "Wi-Fi", icon: <Wifi size={18} /> },
    { key: "parking", label: "Parking", icon: <Car size={18} /> },
    { key: "kitchen", label: "Mətbəx", icon: <CookingPot size={18} /> },
    { key: "air_conditioner", label: "Kondisioner", icon: <Snowflake size={18} /> },
    { key: "heating", label: "İstilik", icon: <Flame size={18} /> },
    { key: "barbecue", label: "Manqal", icon: <Flame size={18} /> },
    { key: "heated_pool", label: "İsti hovuz", icon: <Waves size={18} /> },
    { key: "washing_machine", label: "Paltaryuyan", icon: <Waves size={18} /> },
    { key: "children_allowed", label: "Uşaqlara icazə", icon: <Baby size={18} /> },
    { key: "pets_allowed", label: "Ev heyvanlarına icazə", icon: <PawPrint size={18} /> },
  ];
  const tags = Array.isArray(entity.tags_list) ? entity.tags_list : [];
  const isActive = asBoolean(entity.is_active);
  const isFeatured = asBoolean(entity.is_featured);

  return (
    <>
      <section className="admin-property-hero">
        {entity.cover_url ? (
          <Image
            src={assetUrl(String(entity.cover_url))}
            alt={String(entity.title || "")}
            width={1200}
            height={560}
            unoptimized
          />
        ) : (
          <div className="admin-property-hero-empty"><Home size={42} /></div>
        )}
        <div className="admin-property-hero-overlay">
          <div>
            <h2>{String(entity.title || "Adsız mülk")}</h2>
            <p><MapPin size={16} /> {String(entity.location || "Məkan göstərilməyib")}</p>
          </div>
          <div className="admin-property-statuses">
            <span className={isActive ? "admin-property-status is-positive" : "admin-property-status is-negative"}>
              {isActive ? <CircleCheck size={16} /> : <CircleX size={16} />}
              {isActive ? "Aktiv" : "Deaktiv"}
            </span>
            <span className={isFeatured ? "admin-property-status is-premium" : "admin-property-status"}>
              <Star size={16} fill={isFeatured ? "currentColor" : "none"} />
              {isFeatured ? "Premium" : "Premium deyil"}
            </span>
          </div>
        </div>
      </section>

      <section className="admin-property-metrics">
        <PropertyMetric icon={<Banknote size={20} />} label="Gecəlik qiymət" value={`${entity.price ?? 0} ₼`} />
        <PropertyMetric icon={<Users size={20} />} label="Maksimum qonaq" value={String(entity.capacity ?? 0)} />
        <PropertyMetric icon={<Home size={20} />} label="Otaq sayı" value={String(entity.rooms ?? 0)} />
        <PropertyMetric icon={<Bath size={20} />} label="Hamam sayı" value={String(entity.bathrooms ?? 0)} />
        <PropertyMetric icon={<Eye size={20} />} label="Baxış sayı" value={String(entity.views ?? 0)} />
      </section>

      <div className="admin-property-detail-columns">
        <section className="admin-panel-card admin-property-section">
          <h2><Home size={20} /> Təsvir</h2>
          <textarea
            className="admin-property-readonly-text"
            value={String(entity.description || "Təsvir əlavə edilməyib.")}
            readOnly
            rows={6}
          />
        </section>

        <section className="admin-panel-card admin-property-section">
          <h2><UserRound size={20} /> Ev sahibi</h2>
          <div className="admin-property-owner">
            <span><UserRound size={22} /></span>
            <div>
              {Number(entity.owner_user_id) > 0 ? (
                <Link
                  href={`/admin/users/${entity.owner_user_id}`}
                  className="admin-table-link"
                  title="İstifadəçi profilinə bax"
                >
                  {String(
                    entity.owner_name
                    || entity.owner_username
                    || "—",
                  )}
                </Link>
              ) : (
                <strong>{String(entity.owner_name || entity.owner_username || "—")}</strong>
              )}
            </div>
          </div>
        </section>
      </div>

      <section className="admin-panel-card admin-property-section">
        <h2><BedDouble size={20} /> Yataq və qalma məlumatları</h2>
        <div className="admin-property-metrics admin-property-metrics--inside">
          <PropertyMetric icon={<BedDouble size={20} />} label="Tək nəfərlik yataq" value={String(entity.single_beds ?? 0)} />
          <PropertyMetric icon={<BedDouble size={20} />} label="İki nəfərlik yataq" value={String(entity.double_beds ?? 0)} />
          <PropertyMetric icon={<BedDouble size={20} />} label="Sofa-bed" value={String(entity.sofa_beds ?? 0)} />
          <PropertyMetric icon={<Clock size={20} />} label="Minimum gecə" value={String(entity.minimum_nights ?? 1)} />
          <PropertyMetric icon={<Clock size={20} />} label="Check-in" value={String(entity.check_in_time || "—")} />
          <PropertyMetric icon={<Clock size={20} />} label="Check-out" value={String(entity.check_out_time || "—")} />
        </div>
      </section>

      <section className="admin-panel-card admin-property-section">
        <h2><CalendarCheck size={20} /> Dolu günlər</h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-muted)" }}>
          Boş günlərə klikləyib sahib dolu günü seçin (narıncı). Qırmızı günlər rezervdir — onları dəyişmək olmur.
        </p>
        {calendarLoading ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)" }}>Təqvim yüklənir...</p>
        ) : (
          <>
            <BusyDaysPicker
              blockedDates={blockedDates}
              bookedRanges={bookedRanges}
              onChange={setBlockedDates}
            />
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              style={{ marginTop: 12 }}
              disabled={savingBlocked || propertyId <= 0}
              onClick={() => void handleSaveBlocked()}
            >
              {savingBlocked ? "Saxlanılır..." : "Dolu günləri saxla"}
            </button>
          </>
        )}
      </section>

      <section className="admin-panel-card admin-property-section">
        <h2><CircleCheck size={20} /> İmkanlar</h2>
        <div className="admin-property-amenities">
          {amenities.map((amenity) => {
            const available = asBoolean(entity[amenity.key]);
            return (
              <div key={amenity.key} className={`admin-property-amenity${available ? " is-available" : " is-unavailable"}`}>
                {amenity.icon}
                <span>{amenity.label}</span>
                {available ? <CircleCheck size={16} /> : <CircleX size={16} />}
              </div>
            );
          })}
        </div>
      </section>

      <div className="admin-property-detail-columns">
        <section className="admin-panel-card admin-property-section">
          <h2><ShieldCheck size={20} /> Ev qaydaları</h2>
          <textarea
            className="admin-property-readonly-text"
            value={String(entity.house_rules || "Ev qaydaları əlavə edilməyib.")}
            readOnly
            rows={5}
          />
        </section>
        <section className="admin-panel-card admin-property-section">
          <h2><ShieldCheck size={20} /> Ləğv qaydaları</h2>
          <textarea
            className="admin-property-readonly-text"
            value={String(entity.cancellation_policy || "Ləğv qaydaları əlavə edilməyib.")}
            readOnly
            rows={5}
          />
        </section>
      </div>

      <section className="admin-panel-card admin-property-section">
        <h2><MapPin size={20} /> Ünvan və xəritə</h2>
        <div className="admin-property-location">
          <MapPin size={22} />
          <div>
            <strong>{String(entity.map_address || entity.location || "Ünvan yoxdur")}</strong>
            {entity.latitude && entity.longitude ? (
              <p>Koordinatlar: {String(entity.latitude)}, {String(entity.longitude)}</p>
            ) : null}
          </div>
        </div>
      </section>

      {tags.length > 0 ? (
        <section className="admin-panel-card admin-property-section">
          <h2><Tags size={20} /> Teqlər</h2>
          <div className="admin-summary-row">
            {tags.map((tag) => <span key={String(tag)} className="admin-summary-chip">{String(tag)}</span>)}
          </div>
        </section>
      ) : null}

      {Array.isArray(entity.images) && entity.images.length > 0 ? (
        <section className="admin-panel-card admin-property-section">
          <h2><Home size={20} /> Qalereya</h2>
          <div className="admin-image-grid">
            {(entity.images as AdminPropertyDetail["images"]).map((image) => (
              <div key={image.id} className="admin-image-card">
                <img src={assetUrl(image.url || image.image_path)} alt="" />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function DetailHero({
  entity,
  titleKey,
  image,
  fallbackIcon,
}: {
  entity: Record<string, unknown>;
  titleKey: string;
  image: string;
  fallbackIcon: React.ReactNode;
}) {
  const active = asBoolean(entity.is_active);
  const featured = asBoolean(entity.is_featured);
  return (
    <section className="admin-property-hero">
      {image ? (
        <Image src={assetUrl(image)} alt={String(entity[titleKey] || "")} width={1200} height={560} unoptimized />
      ) : (
        <div className="admin-property-hero-empty">{fallbackIcon}</div>
      )}
      <div className="admin-property-hero-overlay">
        <div>
          <h2>{String(entity[titleKey] || "Adsız")}</h2>
          <p><MapPin size={16} /> {String(entity.location || entity.address || "Məkan göstərilməyib")}</p>
        </div>
        <div className="admin-property-statuses">
          <span className={active ? "admin-property-status is-positive" : "admin-property-status is-negative"}>
            {active ? <CircleCheck size={16} /> : <CircleX size={16} />}
            {active ? "Aktiv" : "Deaktiv"}
          </span>
          <span className={featured ? "admin-property-status is-premium" : "admin-property-status"}>
            <Star size={16} fill={featured ? "currentColor" : "none"} />
            {featured ? "Premium" : "Premium deyil"}
          </span>
        </div>
      </div>
    </section>
  );
}

function ModuleGallery({ images }: { images: unknown }) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return (
    <section className="admin-panel-card admin-property-section">
      <h2><Home size={20} /> Qalereya</h2>
      <div className="admin-image-grid">
        {(images as Array<{ id: number; url?: string; image_path?: string }>).map((image) => (
          <div key={image.id} className="admin-image-card">
            <img src={assetUrl(image.url || image.image_path || "")} alt="" />
          </div>
        ))}
      </div>
    </section>
  );
}

function RestaurantDetailView({ entity }: { entity: Record<string, unknown> }) {
  const cover = String(entity.cover_path || entity.logo_path || "");
  return (
    <>
      <DetailHero
        entity={entity}
        titleKey="name"
        image={cover}
        fallbackIcon={<UtensilsCrossed size={44} />}
      />

      <section className="admin-property-metrics">
        <PropertyMetric icon={<Banknote size={20} />} label="Orta qiymət" value={`${entity.average_price || 0} ₼`} />
        <PropertyMetric icon={<UtensilsCrossed size={20} />} label="Menyu məhsulu" value={String(entity.menu_count ?? 0)} />
        <PropertyMetric icon={<Users size={20} />} label="Menecerlər" value={String(entity.manager_names || "Təyin edilməyib")} />
        <PropertyMetric icon={<Clock size={20} />} label="İş saatları" value={String(entity.opening_hours || "Göstərilməyib")} />
      </section>

      <div className="admin-property-detail-columns">
        <section className="admin-panel-card admin-property-section">
          <h2><UtensilsCrossed size={20} /> Restoran haqqında</h2>
          {entity.short_description ? <p className="admin-detail-lead">{String(entity.short_description)}</p> : null}
          <textarea
            className="admin-property-readonly-text"
            value={String(entity.description || "Restoran təsviri əlavə edilməyib.")}
            readOnly
            rows={7}
          />
        </section>
        <section className="admin-panel-card admin-property-section">
          <h2><Phone size={20} /> Əlaqə məlumatları</h2>
          <div className="admin-contact-list">
            <div><Phone size={17} /><span>Telefon</span><strong>{String(entity.phone || "—")}</strong></div>
            <div><Phone size={17} /><span>WhatsApp</span><strong>{String(entity.whatsapp || "—")}</strong></div>
            <div><MapPin size={17} /><span>Ünvan</span><strong>{String(entity.address || entity.location || "—")}</strong></div>
          </div>
        </section>
      </div>

      <section className="admin-panel-card admin-property-section">
        <h2><Tags size={20} /> Mətbəx və təkliflər</h2>
        <div className="admin-detail-content-grid">
          <div><span>Mətbəx teqləri</span><p>{String(entity.cuisine_tags || "Əlavə edilməyib")}</p></div>
          <div><span>Endirim</span><p>{String(entity.discount_text || "Endirim yoxdur")}</p></div>
        </div>
      </section>

      <section className="admin-panel-card admin-property-section">
        <h2><CookingPot size={20} /> Menyu kateqoriyaları</h2>
        <div className="admin-detail-text-grid">
          {[
            ["local_foods", "Yerli yeməklər"],
            ["foreign_foods", "Xarici yeməklər"],
            ["desserts", "Desertlər"],
            ["drinks", "İçkilər"],
          ].map(([key, label]) => (
            <label key={key}>
              <span>{label}</span>
              <textarea value={String(entity[key] || "Məlumat əlavə edilməyib.")} readOnly rows={4} />
            </label>
          ))}
        </div>
      </section>

      <ModuleGallery images={entity.images} />

      {entity.latitude && entity.longitude ? (
        <section className="admin-panel-card admin-property-section">
          <h2><MapPin size={20} /> Xəritə mövqeyi</h2>
          <div className="admin-property-location">
            <MapPin size={22} />
            <div>
              <strong>{String(entity.address || entity.location)}</strong>
              <p>Koordinatlar: {String(entity.latitude)}, {String(entity.longitude)}</p>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}

function PlaceDetailView({ entity }: { entity: Record<string, unknown> }) {
  return (
    <>
      <DetailHero
        entity={entity}
        titleKey="title"
        image={String(entity.cover_url || entity.cover_path || "")}
        fallbackIcon={<MapPin size={44} />}
      />

      <section className="admin-property-metrics">
        <PropertyMetric
          icon={<Banknote size={20} />}
          label="Giriş qiyməti"
          value={Number(entity.entry_price || 0) > 0 ? `${entity.entry_price} ₼` : "Pulsuz"}
        />
        <PropertyMetric icon={<Star size={20} />} label="Reytinq" value={`${Number(entity.avg_rating || 0).toFixed(1)} / 5`} />
        <PropertyMetric icon={<Users size={20} />} label="Rəy sayı" value={String(entity.rating_count ?? 0)} />
        <PropertyMetric icon={<Tags size={20} />} label="Kateqoriya" value={String(entity.category || "Göstərilməyib")} />
        <PropertyMetric icon={<Clock size={20} />} label="İş saatları" value={String(entity.working_hours || "Göstərilməyib")} />
      </section>

      <div className="admin-property-detail-columns">
        <section className="admin-panel-card admin-property-section">
          <h2><MapPin size={20} /> Məkan haqqında</h2>
          {entity.short_description ? <p className="admin-detail-lead">{String(entity.short_description)}</p> : null}
          <textarea
            className="admin-property-readonly-text"
            value={String(entity.description || "Məkan təsviri əlavə edilməyib.")}
            readOnly
            rows={7}
          />
        </section>
        <section className="admin-panel-card admin-property-section">
          <h2><Phone size={20} /> Ziyarət məlumatları</h2>
          <div className="admin-contact-list">
            <div><MapPin size={17} /><span>Ünvan</span><strong>{String(entity.address || entity.location || "—")}</strong></div>
            <div><Phone size={17} /><span>Telefon</span><strong>{String(entity.phone || "—")}</strong></div>
            <div><Clock size={17} /><span>İş saatları</span><strong>{String(entity.working_hours || "—")}</strong></div>
          </div>
        </section>
      </div>

      <section className="admin-panel-card admin-property-section">
        <h2><CircleCheck size={20} /> Ziyarət üçün məsləhətlər</h2>
        <textarea
          className="admin-property-readonly-text"
          value={String(entity.tips || "Məsləhət əlavə edilməyib.")}
          readOnly
          rows={5}
        />
      </section>

      <section className="admin-panel-card admin-property-section">
        <h2><MapPin size={20} /> Xəritə və koordinatlar</h2>
        <div className="admin-property-location">
          <MapPin size={22} />
          <div>
            <strong>{String(entity.address || entity.location || "Ünvan yoxdur")}</strong>
            {entity.latitude && entity.longitude ? (
              <p>Koordinatlar: {String(entity.latitude)}, {String(entity.longitude)}</p>
            ) : <p>Koordinatlar əlavə edilməyib.</p>}
          </div>
        </div>
      </section>

      <ModuleGallery images={entity.images} />
    </>
  );
}

function UserDetailView({ entity }: { entity: Record<string, unknown> }) {
  const role = String(entity.role || "user");
  const roleLabel = role === "admin" ? "Admin" : role === "owner" ? "Sahib" : "İstifadəçi";
  const properties = Array.isArray(entity.properties)
    ? (entity.properties as Array<Record<string, unknown>>)
    : [];
  const propertyCount = Array.isArray(entity.properties)
    ? properties.length
    : Number(entity.property_count ?? 0);

  return (
    <>
      <section className="admin-property-metrics">
        <PropertyMetric icon={<UserRound size={20} />} label="Rol" value={roleLabel} />
        <PropertyMetric icon={<Building2 size={20} />} label="Mülk sayı" value={String(propertyCount)} />
        <PropertyMetric icon={<CalendarCheck size={20} />} label="Rezervasiya" value={String(entity.booking_count ?? 0)} />
        <PropertyMetric icon={<Banknote size={20} />} label="Balans" value={`${Number(entity.wallet_balance ?? 0).toFixed(2)} ₼`} />
      </section>

      <div className="admin-property-detail-columns">
        <section className="admin-panel-card admin-property-section">
          <h2><UserRound size={20} /> Profil</h2>
          <div className="admin-contact-list">
            <div>
              <UserRound size={16} />
              <span>Ad</span>
              <strong>{String(entity.full_name || "—")}</strong>
            </div>
            <div>
              <UserRound size={16} />
              <span>Username</span>
              <strong>@{String(entity.username || "—")}</strong>
            </div>
            <div>
              <Phone size={16} />
              <span>Telefon</span>
              <strong>{String(entity.phone || "—")}</strong>
            </div>
            {entity.owner_login_id ? (
              <div>
                <ShieldCheck size={16} />
                <span>Sahib ID</span>
                <strong>{String(entity.owner_login_id)}</strong>
              </div>
            ) : null}
          </div>
        </section>

        <section className="admin-panel-card admin-property-section">
          <h2><ShieldCheck size={20} /> Status</h2>
          <div className="admin-summary-row">
            <span className={asBoolean(entity.is_verified) ? "admin-badge admin-badge--ok" : "admin-badge"}>
              {asBoolean(entity.is_verified) ? "Telefon təsdiqli" : "Telefon təsdiqsiz"}
            </span>
            <span className={asBoolean(entity.is_approved) ? "admin-badge admin-badge--ok" : "admin-badge"}>
              {asBoolean(entity.is_approved) ? "İcazəlidir" : "Təsdiq gözləyir"}
            </span>
            {asBoolean(entity.can_switch_owner) ? (
              <span className="admin-badge admin-badge--ok">Sahib rejiminə keçə bilər</span>
            ) : null}
          </div>
          {entity.owner_bio ? (
            <textarea
              className="admin-property-readonly-text"
              style={{ marginTop: 14 }}
              value={String(entity.owner_bio)}
              readOnly
              rows={4}
            />
          ) : null}
        </section>
      </div>

      <section className="admin-panel-card admin-property-section">
        <h2><Building2 size={20} /> Mülklər ({properties.length})</h2>
        {properties.length === 0 ? (
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Bu istifadəçinin mülkü yoxdur.</p>
        ) : (
          <div className="admin-table-wrap" style={{ marginTop: 12 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ev</th>
                  <th>Qiymət</th>
                  <th>Baxış</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => {
                  const propertyId = Number(property.id);
                  return (
                    <tr key={propertyId}>
                      <td>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {property.cover_url ? (
                            <Image
                              src={assetUrl(String(property.cover_url))}
                              alt=""
                              width={48}
                              height={48}
                              className="admin-thumb"
                              unoptimized
                            />
                          ) : (
                            <div className="admin-thumb" />
                          )}
                          <div>
                            <Link
                              href={`/admin/properties/${propertyId}`}
                              className="admin-table-link"
                            >
                              <strong>{String(property.title || `#${propertyId}`)}</strong>
                            </Link>
                            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                              {String(property.location || "—")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{Number(property.price ?? 0)} ₼</td>
                      <td>{Number(property.views ?? 0)}</td>
                      <td>
                        <span className="admin-table-badges">
                          <span className={asBoolean(property.is_active) ? "admin-badge admin-badge--ok" : "admin-badge"}>
                            {asBoolean(property.is_active) ? "Aktiv" : "Deaktiv"}
                          </span>
                          {asBoolean(property.is_featured) ? (
                            <span className="admin-badge admin-badge--premium">
                              Premium
                            </span>
                          ) : null}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export function AdminEntityDetailPage({
  resource,
  id,
}: {
  resource: AdminDetailResource;
  id: number;
}) {
  const { admin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editing = searchParams.get("edit") === "1";
  const meta = RESOURCE_META[resource];
  const [entity, setEntity] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const res = await adminApi.getEntityDetail(resource, id);
    if (res.success && res.data) {
      setEntity(res.data.entity);
      setForm(res.data.entity);
    } else {
      setError(res.error || "Məlumat yüklənmədi");
    }
    setLoading(false);
  }, [id, resource]);

  useEffect(() => {
    if (!admin) return;
    void load();
  }, [admin, load]);

  const editableKeys = useMemo(
    () => new Set(meta.fields.map((field) => field.key)),
    [meta.fields],
  );

  async function save() {
    if (resource === "properties") return;
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(form).filter(([key]) => editableKeys.has(key)),
    );
    const res = await adminApi.updateEntity(resource, id, payload);
    if (res.success && res.data) {
      setEntity(res.data.entity);
      setForm(res.data.entity);
      toast.success(res.data.message || `${meta.singular} yeniləndi.`);
      router.replace(`/admin/${resource}/${id}`);
    } else {
      toast.error(res.error || "Yenilənmədi");
    }
    setSaving(false);
  }

  function cancelEdit() {
    if (entity) setForm(entity);
    router.replace(`/admin/${resource}/${id}`);
  }

  if (adminLoading || loading) return <div className="admin-loading">Məlumat yüklənir...</div>;
  if (!admin) return null;

  return (
    <AdminShell>
      <div className="admin-page">
        <div className="admin-detail-head">
          <div>
            <Link href={meta.back} className="admin-detail-back">
              <ArrowLeft size={16} aria-hidden="true" />
              Siyahıya qayıt
            </Link>
            {!["properties", "restaurants", "places"].includes(resource) ? (
              <span className="section-kicker">{meta.singular} #{id}</span>
            ) : null}
            <h1>
              {resource === "users"
                ? String(entity?.full_name || entity?.username || `${meta.singular} #${id}`)
                : ["properties", "restaurants", "places"].includes(resource)
                  ? `${meta.singular} #${id}`
                  : meta.title}
            </h1>
          </div>
          {!editing ? (
            <button
              type="button"
              className="admin-btn admin-btn--primary admin-btn--nowrap"
              onClick={() => router.push(`/admin/${resource}/${id}?edit=1`)}
            >
              <Pencil size={16} aria-hidden="true" />
              Redaktə et
            </button>
          ) : null}
        </div>

        {error ? <div className="alert alert-error">{error}</div> : null}

        {editing && resource === "properties" ? (
          <AdminPropertyForm
            propertyId={id}
            onSaved={() => {
              void load();
              router.replace(`/admin/properties/${id}`);
            }}
            onCancel={cancelEdit}
          />
        ) : editing && (resource === "restaurants" || resource === "places") ? (
          <AdminModuleForm
            resource={resource}
            entity={entity}
            onSaved={(_, updatedEntity) => {
              if (updatedEntity) {
                setEntity(updatedEntity);
                setForm(updatedEntity);
              } else {
                void load();
              }
              router.replace(`/admin/${resource}/${id}`);
            }}
            onCancel={cancelEdit}
          />
        ) : editing ? (
          <section className="admin-panel-card">
            <div className="admin-detail-form">
              {meta.fields.map((field) => (
                <label
                  key={field.key}
                  className={field.type === "textarea" ? "admin-detail-field admin-detail-field--wide" : "admin-detail-field"}
                >
                  <span>{field.label}</span>
                  {field.type === "boolean" ? (
                    <input
                      type="checkbox"
                      checked={asBoolean(form[field.key])}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.checked }))}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={String(form[field.key] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    >
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      rows={4}
                      value={String(form[field.key] ?? "")}
                      onChange={(event) => setForm((current) => ({ ...current, [field.key]: event.target.value }))}
                    />
                  ) : (
                    <input
                      type={
                        isPhoneFieldKey(field.key)
                          ? "tel"
                          : field.type === "number"
                            ? "number"
                            : field.type === "date"
                              ? "date"
                              : "text"
                      }
                      inputMode={isPhoneFieldKey(field.key) ? "numeric" : undefined}
                      pattern={isPhoneFieldKey(field.key) ? "[0-9]*" : undefined}
                      step={field.type === "number" ? "any" : undefined}
                      value={String(form[field.key] ?? "")}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [field.key]: isPhoneFieldKey(field.key)
                            ? sanitizePhoneInput(event.target.value)
                            : event.target.value,
                        }))
                      }
                    />
                  )}
                </label>
              ))}
            </div>
            <div className="admin-toolbar">
              <button type="button" className="admin-btn admin-btn--primary admin-btn--nowrap" disabled={saving} onClick={() => void save()}>
                <Save size={16} aria-hidden="true" />
                {saving ? "Saxlanılır..." : "Saxla"}
              </button>
              <button type="button" className="admin-btn admin-btn--nowrap" disabled={saving} onClick={cancelEdit}>
                <X size={16} aria-hidden="true" />
                Ləğv et
              </button>
            </div>
          </section>
        ) : entity && resource === "properties" ? (
          <PropertyDetailView entity={entity} />
        ) : entity && resource === "restaurants" ? (
          <RestaurantDetailView entity={entity} />
        ) : entity && resource === "places" ? (
          <PlaceDetailView entity={entity} />
        ) : entity && resource === "users" ? (
          <UserDetailView entity={entity} />
        ) : entity ? (
          <>
            <section className="admin-detail-grid">
              {Object.entries(entity)
                .filter(([key, value]) => key !== "images" && key !== "cover_image" && key !== "messages" && typeof value !== "object")
                .map(([key, value]) => (
                  <div key={key} className="admin-detail-item">
                    <span>{FIELD_LABELS[key] || meta.fields.find((field) => field.key === key)?.label || key.replaceAll("_", " ")}</span>
                    <strong>{displayValue(value)}</strong>
                  </div>
                ))}
            </section>
            {resource === "messages" && Array.isArray(entity.messages) ? (
              <section className="admin-panel-card">
                <h2>Mesajlar</h2>
                <div className="admin-message-detail-list">
                  {(entity.messages as Array<Record<string, unknown>>).map((message) => (
                    <article key={String(message.id)} className="admin-message-detail">
                      <div>
                        <strong>{String(message.sender_name || `#${message.sender_user_id}`)}</strong>
                        <time>{String(message.created_at || "")}</time>
                      </div>
                      <p>{String(message.message || "")}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </AdminShell>
  );
}
