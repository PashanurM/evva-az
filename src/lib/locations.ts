/** Canonical Gabala area options used by search, owner edit, and admin forms. */
export const GABALA_LOCATIONS = ["Mərkəz", "Vəndam", "Bum", "Nic", "Qəmərvan"] as const;

export type GabalaLocation = (typeof GABALA_LOCATIONS)[number];

export function resolveLocationOptions(extra: string[] = []): string[] {
  const set = new Set<string>([...GABALA_LOCATIONS, ...extra.filter(Boolean)]);
  return Array.from(set);
}
