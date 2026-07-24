const AZ_CHAR_MAP: Record<string, string> = {
  ə: "e",
  ı: "i",
  ö: "o",
  ü: "u",
  ğ: "g",
  ç: "c",
  ş: "s",
  Ə: "e",
  I: "i",
  İ: "i",
  Ö: "o",
  Ü: "u",
  Ğ: "g",
  Ç: "c",
  Ş: "s",
};

/** Match backend slugify() for Azerbaijani titles. */
export function slugify(value: string): string {
  const lower = value.trim().toLocaleLowerCase("az");
  const mapped = lower.replace(/[əıöüğçşƏIİÖÜĞÇŞ]/g, (ch) => AZ_CHAR_MAP[ch] || ch);
  return (
    mapped
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function entitySlug(input: {
  id: number;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
}): string {
  const existing = (input.slug || "").trim();
  if (existing) return existing;
  const title = (input.title || input.name || "").trim();
  const base = slugify(title);
  return `${base}-${input.id}`;
}

export function placePath(place: {
  id: number;
  slug?: string | null;
  title?: string | null;
}): string {
  return `/places/${entitySlug(place)}`;
}

export function restaurantPath(restaurant: {
  id: number;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
}): string {
  return `/restaurants/${entitySlug(restaurant)}`;
}
