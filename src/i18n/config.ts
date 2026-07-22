export const LOCALES = ["az", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "az";
export const LOCALE_STORAGE_KEY = "evva-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  az: "AZ",
  ru: "RU",
  en: "EN",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return LOCALES.includes(value as Locale);
}
