import type { DivIcon, Icon, Map as LeafletMap } from "leaflet";

type LeafletStatic = typeof import("leaflet");

let patched = false;

export async function loadLeaflet(): Promise<LeafletStatic> {
  const mod = await import("leaflet");
  const L = ((mod as unknown as { default?: LeafletStatic }).default ??
    mod) as LeafletStatic;

  if (!patched) {
    // Next/Turbopack breaks Leaflet's default PNG icon paths → broken "Mark…" images.
    // Point defaults at CDN, and prefer DivIcon for property markers.
    const proto = L.Icon.Default.prototype as L.Icon.Default & {
      _getIconUrl?: unknown;
    };
    delete proto._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
    patched = true;
  }

  return L;
}

export function escapeLeafletHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type PropertyMarkerOptions = {
  price: number | string;
  title?: string;
  image?: string;
  premium?: boolean;
};

export function createPropertyMarkerIcon(
  L: LeafletStatic,
  options: PropertyMarkerOptions,
): DivIcon {
  const priceLabel = `${options.price} ₼`;
  const title = escapeLeafletHtml(options.title || "");
  const photo = options.image
    ? `<img class="evva-map-marker-photo" src="${escapeLeafletHtml(options.image)}" alt="" loading="lazy" onerror="var s=document.createElement('span');s.className='evva-map-marker-dot';s.setAttribute('aria-hidden','true');this.replaceWith(s);" />`
    : `<span class="evva-map-marker-dot" aria-hidden="true"></span>`;

  return L.divIcon({
    className: "evva-map-marker",
    html: `
      <div class="evva-map-marker-inner${options.premium ? " is-premium" : ""}" title="${title}">
        ${photo}
        <span class="evva-map-marker-price">${escapeLeafletHtml(priceLabel)}</span>
      </div>
    `,
    iconSize: [86, 36],
    iconAnchor: [43, 36],
    popupAnchor: [0, -32],
  });
}

export function createPickerMarkerIcon(L: LeafletStatic): DivIcon {
  return L.divIcon({
    className: "evva-map-picker-icon",
    html: `<span class="evva-map-picker-pin"></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
  });
}

export type { Icon, LeafletMap };
