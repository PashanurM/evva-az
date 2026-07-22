import type { Metadata } from "next";

/** Static SEO metadata — replace with admin API values later. */
export const SITE_NAME = "EVVA.AZ";

export const BASE_KEYWORDS = [
  "EVVA.AZ",
  "Qəbələ",
  "Gabala",
  "Azərbaycan",
  "turizm",
] as const;

export const KEYWORDS = {
  home: [
    ...BASE_KEYWORDS,
    "Qəbələ kirayə ev",
    "Qəbələ günlük kirayə",
    "Qəbələ villa",
    "A-frame Qəbələ",
    "hovuzlu ev Qəbələ",
    "Gabala villa rental",
    "daily rental Gabala",
  ],
  property: [
    ...BASE_KEYWORDS,
    "günlük kirayə ev",
    "villa kirayə",
    "A-frame kirayə",
    "hovuzlu ev",
    "ailəvi istirahət",
    "Gabala rental",
  ],
  places: [
    ...BASE_KEYWORDS,
    "gəzməli yerlər",
    "Qəbələ turizm",
    "turistik məkanlar",
    "Gabala attractions",
    "sightseeing Gabala",
  ],
  restaurants: [
    ...BASE_KEYWORDS,
    "Qəbələ restoran",
    "restoranlar",
    "yemək",
    "Gabala restaurants",
    "dining Gabala",
  ],
  delivery: [
    ...BASE_KEYWORDS,
    "çatdırılma",
    "EVVA Delivery",
    "qonaq evinə çatdırılma",
    "food delivery Gabala",
  ],
  auth: [...BASE_KEYWORDS, "daxil ol", "qeydiyyat", "EVVA hesab"],
  profile: [...BASE_KEYWORDS, "profil", "hesab", "EVVA istifadəçi"],
  favorites: [...BASE_KEYWORDS, "seçilmişlər", "favorit elanlar", "saved listings"],
  messages: [...BASE_KEYWORDS, "mesajlar", "söhbət", "EVVA chat"],
  chat: [...BASE_KEYWORDS, "mesaj yaz", "elan sahibi", "EVVA chat"],
  booking: [...BASE_KEYWORDS, "rezervasiya", "bron", "günlük kirayə rezerv"],
  myHouses: [...BASE_KEYWORDS, "mənim evlərim", "elanlarım", "host panel"],
  myBookings: [...BASE_KEYWORDS, "bronlarım", "rezervasiyalarım", "booking history"],
} as const;

interface PageMetaInput {
  title: string;
  description?: string;
  keywords?: readonly string[];
}

export function createPageMetadata({
  title,
  description,
  keywords = BASE_KEYWORDS,
}: PageMetaInput): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    keywords: [...keywords],
    openGraph: {
      title,
      ...(description ? { description } : {}),
      type: "website",
      siteName: SITE_NAME,
    },
  };
}

export const siteMetadata = createPageMetadata({
  title: "EVVA.AZ | Qəbələdə günlük kirayə evlər, villa və A-frame",
  description:
    "EVVA.AZ — Qəbələdə günlük kirayə ev, villa, A-frame, hovuzlu ev və ailəvi istirahət üçün seçilmiş elanlar.",
  keywords: KEYWORDS.home,
});

export const pageMetadata = {
  home: siteMetadata,
  login: createPageMetadata({
    title: "Daxil ol | EVVA.AZ",
    description: "EVVA.AZ hesabınıza daxil olun və elanları idarə edin.",
    keywords: KEYWORDS.auth,
  }),
  register: createPageMetadata({
    title: "Qeydiyyat | EVVA.AZ",
    description: "EVVA.AZ-da yeni hesab yaradın və elanları izləyin.",
    keywords: KEYWORDS.auth,
  }),
  forgotPassword: createPageMetadata({
    title: "Şifrəni unutdum | EVVA.AZ",
    description: "EVVA.AZ hesabınız üçün şifrəni özünüz yeniləyin.",
    keywords: KEYWORDS.auth,
  }),
  profile: createPageMetadata({
    title: "Profil | EVVA.AZ",
    description: "EVVA.AZ profil məlumatlarınızı və hesab parametrlərini idarə edin.",
    keywords: KEYWORDS.profile,
  }),
  favorites: createPageMetadata({
    title: "Seçilmişlər | EVVA.AZ",
    description: "EVVA.AZ-da saxladığınız seçilmiş elanları görün.",
    keywords: KEYWORDS.favorites,
  }),
  messages: createPageMetadata({
    title: "Mesajlar | EVVA.AZ",
    description: "EVVA.AZ mesajlarınızı və söhbətlərinizi idarə edin.",
    keywords: KEYWORDS.messages,
  }),
  chat: createPageMetadata({
    title: "Mesaj yaz | EVVA.AZ",
    description: "EVVA.AZ-da elan sahibinə birbaşa mesaj göndərin.",
    keywords: KEYWORDS.chat,
  }),
  booking: createPageMetadata({
    title: "Rezerv et | EVVA.AZ",
    description: "EVVA.AZ-da seçdiyiniz evi onlayn rezerv edin.",
    keywords: KEYWORDS.booking,
  }),
  myHouses: createPageMetadata({
    title: "Mənim evlərim | EVVA.AZ",
    description: "EVVA.AZ-da yerləşdirdiyiniz elanları idarə edin.",
    keywords: KEYWORDS.myHouses,
  }),
  myBookings: createPageMetadata({
    title: "Bronlarım | EVVA.AZ",
    description: "EVVA.AZ-da etdiyiniz rezervasiyaları izləyin.",
    keywords: KEYWORDS.myBookings,
  }),
  places: createPageMetadata({
    title: "Gəzməli yerlər | EVVA.AZ",
    description: "Qəbələdə gəzməli yerlər, turistik məkanlar və marşrutlar.",
    keywords: KEYWORDS.places,
  }),
  restaurants: createPageMetadata({
    title: "Qəbələ Restoranları | EVVA.AZ",
    description: "Qəbələdə restoranlar, menyular və qiymətlər.",
    keywords: KEYWORDS.restaurants,
  }),
  delivery: createPageMetadata({
    title: "EVVA Çatdırılma | EVVA.AZ",
    description: "Qonaq evinə çatdırılma xidməti — EVVA Delivery.",
    keywords: KEYWORDS.delivery,
  }),
  propertyNotFound: createPageMetadata({
    title: "Elan tapılmadı | EVVA.AZ",
    description: "Axtardığınız elan tapılmadı və ya artıq aktiv deyil.",
    keywords: KEYWORDS.property,
  }),
  placeNotFound: createPageMetadata({
    title: "Məkan tapılmadı | EVVA.AZ",
    description: "Axtardığınız turistik məkan tapılmadı.",
    keywords: KEYWORDS.places,
  }),
  restaurantNotFound: createPageMetadata({
    title: "Restoran tapılmadı | EVVA.AZ",
    description: "Axtardığınız restoran tapılmadı.",
    keywords: KEYWORDS.restaurants,
  }),
  deliveryNotFound: createPageMetadata({
    title: "Çatdırılma evi tapılmadı | EVVA.AZ",
    description: "Axtardığınız çatdırılma ünvanı tapılmadı.",
    keywords: KEYWORDS.delivery,
  }),
} as const;

export function createDynamicMetadata({
  title,
  description,
  keywords = BASE_KEYWORDS,
}: PageMetaInput): Metadata {
  return createPageMetadata({ title, description, keywords });
}
