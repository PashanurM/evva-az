import type { Property } from "@/types";

const BASE = "https://rahim.alwaysdata.net/booking";

export const properties: Property[] = [
  {
    id: 9,
    title: "Toğrul A Frame",
    location: "Vəndam",
    price: 200,
    guests: 10,
    rooms: 4,
    bathrooms: 1,
    views: 30,
    rating: 10,
    description: "Toğrul A Frame",
    tags: ["Yeni", "Hovuzlu", "Ailə üçün", "Dağ mənzərəli", "Mərkəzə yaxın", "Premium"],
    image: `${BASE}/uploads/properties/9/fe1187b7f185d5b93685f64d1927f104.jpeg`,
    lat: 40.9325469,
    lng: 47.9331565,
    premium: true,
  },
  {
    id: 8,
    title: "Aga Villa",
    location: "Vəndam",
    price: 200,
    guests: 10,
    rooms: 5,
    bathrooms: 1,
    views: 39,
    rating: 10,
    description: "Ağa Villa",
    tags: ["Yeni", "A-frame", "Dağ mənzərəli", "Lüks", "Qrup üçün", "Romantik"],
    image: `${BASE}/uploads/properties/8/5b81531caa0a58c2d56a6ececf9e743c.jpeg`,
    lat: 40.9424353,
    lng: 47.938883,
    premium: true,
  },
  {
    id: 12,
    title: "Vandam Elchin Villa",
    location: "Vəndam, Qəbələ",
    price: 180,
    guests: 10,
    rooms: 4,
    bathrooms: 2,
    views: 0,
    rating: 0,
    description:
      "Vandam Elçin Villa Qəbələ rayonu, Vəndam qəsəbəsində yerləşir. Ev 2 mərtəbədən, 3 yataq otağı, 2 hamam ...",
    tags: ["Hovuzlu", "Ailə üçün", "Dağ mənzərəli"],
    image: `${BASE}/uploads/properties/12/cb069bba4ec445e18f2219337b0fe0d5.jpeg`,
    lat: 40.9479474,
    lng: 47.9441696,
  },
  {
    id: 11,
    title: "Gabala Elshad Villa",
    location: "Qəbələ, Mərkəz",
    price: 180,
    guests: 9,
    rooms: 4,
    bathrooms: 2,
    views: 6,
    rating: 0,
    description:
      "Gabala Elşad Villa Qəbələ rayonunun mərkəzində 2 mərtəbəli müasir villa. Qəbələnd və Tufandağın yaxınlığın...",
    tags: ["Yeni", "Hovuzlu", "Ailə üçün", "Dağ mənzərəli", "Mərkəzə yaxın"],
    image: `${BASE}/uploads/properties/11/62172f88c77d9bdff694ad707486f838.jpeg`,
    lat: 40.9949085,
    lng: 47.8621826,
  },
  {
    id: 10,
    title: "Vandam Luminous Villa",
    location: "Vəndam , Qəbələ",
    price: 150,
    guests: 10,
    rooms: 3,
    bathrooms: 1,
    views: 15,
    rating: 0,
    description:
      "Vandam Luminous Villa Qəbələ rayonu, Vəndam qəsəbəsi 3 yataq otaqlı - 10 nəfərlik hovuzlu həyət evi",
    tags: ["Hovuzlu", "Ailə üçün", "Dağ mənzərəli"],
    image: `${BASE}/uploads/properties/10/8ecc4d35e08baf9f5facb39b161db835.jpeg`,
    lat: 40.939306,
    lng: 47.9407954,
    bookedDays: [3, 4, 5, 6],
  },
  {
    id: 7,
    title: "Vandam Moonlight Villa",
    location: "Vəndam , Qəbələ",
    price: 200,
    guests: 10,
    rooms: 5,
    bathrooms: 2,
    views: 76,
    rating: 10,
    description: "Vandam Moonlight Villa",
    tags: ["Yeni", "Meşə", "Mərkəz", "A-frame", "Dağ mənzərəli", "Lüks", "Qrup üçün", "Romantik"],
    image: `${BASE}/uploads/properties/7/1713fb2bd6239b4248baa68223e38ed8.jpg`,
    lat: 40.9401205,
    lng: 47.9361445,
  },
];

export const locations = ["Mərkəz", "Vəndam", "Bum", "Nic", "Qəmərvan"];

// Re-export canonical list for callers that still import from data/properties.
export { GABALA_LOCATIONS } from "@/lib/locations";

export const filterTags = [
  "VİLLA",
  "A-frame",
  "Cakkuzi",
  "Sauna",
  "Hovuz",
  "İsti hovuz",
  "Qapalı hovuz",
  "Frame",
  "Bilyard",
  "Tennis",
  "Yelləncək",
  "Qapalı çardaq",
];

export function getPropertyById(id: number): Property | undefined {
  return properties.find((p) => p.id === id);
}

export function filterProperties(filters: {
  search?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minRooms?: number;
  minBathrooms?: number;
  tags?: string[];
  sort?: string;
}): Property[] {
  let result = [...properties];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }

  if (filters.location) {
    result = result.filter((p) =>
      p.location.toLowerCase().includes(filters.location!.toLowerCase())
    );
  }

  if (filters.minPrice != null) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice != null) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.minRooms != null) {
    result = result.filter((p) => p.rooms >= filters.minRooms!);
  }

  if (filters.minBathrooms != null) {
    result = result.filter((p) => p.bathrooms >= filters.minBathrooms!);
  }

  if (filters.tags?.length) {
    result = result.filter((p) =>
      filters.tags!.some((tag) =>
        p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
      )
    );
  }

  switch (filters.sort) {
    case "price_desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "price_asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "views_desc":
      result.sort((a, b) => b.views - a.views);
      break;
    case "rating_desc":
      result.sort((a, b) => b.rating - a.rating);
      break;
    default:
      break;
  }

  return result;
}
