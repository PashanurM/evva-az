import type { Dictionary } from "./types";

export function createTranslator(dict: Dictionary) {
  return function t(
    key: string,
    vars?: Record<string, string | number>,
  ): string {
    const parts = key.split(".");
    let value: unknown = dict;

    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") return key;
    if (!vars) return value;

    return Object.entries(vars).reduce(
      (result, [name, val]) =>
        result.replace(new RegExp(`\\{${name}\\}`, "g"), String(val)),
      value,
    );
  };
}
