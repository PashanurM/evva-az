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
  const id = Number(input.id);
  const existing = (input.slug || "").trim();
  const title = (input.title || input.name || "").trim();
  let base = existing || slugify(title) || "item";

  // Drop a trailing -{id} so we never double-append, then always end with -{id}
  // so detail pages can resolve via numeric id on older backends.
  if (id > 0) {
    const idSuffix = new RegExp(`-${id}$`);
    if (idSuffix.test(base)) {
      base = base.replace(idSuffix, "");
    }
    base = base.replace(/^-+|-+$/g, "") || "item";
    return `${base}-${id}`;
  }

  return base || "item";
}

/** Numeric id from `/places/12` or `/places/nohur-gol-12`. */
export function entityIdFromKey(idOrSlug: number | string): number | null {
  const key = String(idOrSlug).trim();
  if (!key) return null;
  if (/^\d+$/.test(key)) return Number(key);
  const match = key.match(/-(\d+)$/);
  return match ? Number(match[1]) : null;
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
