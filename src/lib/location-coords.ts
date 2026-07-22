/** Approximate coords for Qəbələ areas when a listing has no lat/lng in DB. */
const LOCATION_COORDS: Array<{ match: string; lat: number; lng: number }> = [
  { match: "vəndam", lat: 40.9424, lng: 47.9389 },
  { match: "vandam", lat: 40.9424, lng: 47.9389 },
  { match: "nohur", lat: 40.9312, lng: 47.9015 },
  { match: "qəmərvan", lat: 40.9235, lng: 47.8678 },
  { match: "qemervan", lat: 40.9235, lng: 47.8678 },
  { match: "nic", lat: 40.8935, lng: 47.9152 },
  { match: "bum", lat: 40.9489, lng: 47.8188 },
  { match: "mərkəz", lat: 40.9814, lng: 47.8458 },
  { match: "merkez", lat: 40.9814, lng: 47.8458 },
  { match: "qəbələ", lat: 40.9814, lng: 47.8458 },
  { match: "gabala", lat: 40.9814, lng: 47.8458 },
];

export function resolvePropertyCoordinates(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
  location: string,
): { lat: number; lng: number } | null {
  if (
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude !== 0 &&
    longitude !== 0
  ) {
    return { lat: latitude, lng: longitude };
  }

  const normalized = location.toLowerCase();
  for (const entry of LOCATION_COORDS) {
    if (normalized.includes(entry.match)) {
      return { lat: entry.lat, lng: entry.lng };
    }
  }

  return null;
}
