/**
 * Keep only digits for phone fields (no letters, spaces, or symbols).
 */
export function sanitizePhoneInput(value: string, maxLength = 20): string {
  return value.replace(/\D+/g, "").slice(0, maxLength);
}

export function isPhoneFieldKey(key: string): boolean {
  const k = key.toLowerCase();
  return k === "phone" || k === "whatsapp" || k.endsWith("_phone") || k.endsWith("phone");
}
