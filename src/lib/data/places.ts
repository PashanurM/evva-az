import type { Place } from "@/types";

const BASE = "https://rahim.alwaysdata.net/booking";

export const places: Place[] = [
  {
    id: 1,
    title: "Şəlaləaltı Restoran",
    description: "Qəbələ Şəlaləaltı Restoranı",
    longDescription:
      "Qəbələ Şəlaləaltı Restoranı — təbiət qoynasında, dağ mənzərəli restoran və istirahət məkanı. Ailəlik günü keçirmək, yerli mətbəx dadları və sakit atmosfer axtaran qonaqlar üçün uyğun seçimdir.",
    category: "Restoran",
    location: "Vəndam, Qəbələ",
    address: "Qəbələ rayonu, Vəndam istiqaməti",
    hours: "07:00 - 23:00",
    entryFee: "Pulsuz / qeyd edilməyib",
    premium: true,
    rating: 0,
    voteCount: 0,
    image: `${BASE}/uploads/places/1/b033e159e11ea923da2fbbaffd41a8b6.webp`,
    images: [
      `${BASE}/uploads/places/1/b033e159e11ea923da2fbbaffd41a8b6.webp`,
      `${BASE}/uploads/places/1/84d5ec43ddbea055970c2d0681b5b50d.webp`,
      `${BASE}/uploads/places/1/1c5ff54057cce38b27871ff9fe46b7f7.webp`,
      `${BASE}/uploads/places/1/b45c1ec88eb595824962f8f8869c8d79.webp`,
    ],
    lat: 40.945,
    lng: 47.942,
  },
];

export function getPlaceById(id: number): Place | undefined {
  return places.find((p) => p.id === id);
}

export function getAllPlaceIds(): number[] {
  return places.map((p) => p.id);
}
