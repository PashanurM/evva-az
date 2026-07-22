export function assetUrl(path: string): string {
  if (!path) return "/assets/no-image.svg";

  const clean = path.trim().replaceAll("\\", "/");
  const assetBase =
    process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/+$/, "") ||
    (process.env.NODE_ENV === "production"
      ? "https://pashanur.alwaysdata.net"
      : "");
  const proxiedAsset = (assetPath: string) =>
    assetBase
      ? `${assetBase}/${assetPath.replace(/^\/+/, "")}`
      : `/api/assets/${assetPath.replace(/^\/+/, "")}`;

  // Older PHP responses exposed the internal front-controller directory.
  // Uploaded files are publicly served from /uploads/* by the root rewrite.
  const uploadsMarker = "/backend/public/uploads/";
  const uploadsIndex = clean.indexOf(uploadsMarker);
  if (uploadsIndex >= 0) {
    return proxiedAsset(`uploads/${clean.slice(uploadsIndex + uploadsMarker.length)}`);
  }

  const internalPublicMarker = "/backend/public/";
  const internalPublicIndex = clean.indexOf(internalPublicMarker);
  if (internalPublicIndex >= 0) {
    return proxiedAsset(clean.slice(internalPublicIndex + internalPublicMarker.length));
  }

  if (/^https?:\/\//i.test(clean) || clean.startsWith("data:")) return clean;

  const relativeUploadsIndex = clean.indexOf("uploads/");
  if (relativeUploadsIndex >= 0) {
    return proxiedAsset(clean.slice(relativeUploadsIndex));
  }

  if (clean.startsWith("/")) return clean;
  return `/${clean}`;
}
