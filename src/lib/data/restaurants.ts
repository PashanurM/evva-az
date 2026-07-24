import type { Restaurant } from "@/types";
import { entitySlug } from "@/lib/slug";

export const restaurants: Restaurant[] = [
  {
    id: 1,
    title: "Caspian Fish&Seafood",
    slug: entitySlug({ id: 1, title: "Caspian Fish&Seafood" }),
    location: "Qəbələ",
    premium: true,
    rating: 9.2,
  },
  {
    id: 2,
    title: "Mənzərə Restoran Qəbələ",
    slug: entitySlug({ id: 2, title: "Mənzərə Restoran Qəbələ" }),
    location: "Qəbələ, Vəndam",
    premium: true,
    rating: 8.8,
  },
];
