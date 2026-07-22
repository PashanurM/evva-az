import type { Locale } from "../config";
import { az } from "./az";
import { ru } from "./ru";
import { en } from "./en";

export const dictionaries = {
  az,
  ru,
  en,
} as const;

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export { az, ru, en };
