/**
 * Compress / resize images before upload so hosts with small
 * body limits (HTTP 413) rarely reject the request.
 */

const DEFAULT_MAX_EDGE = 1920;
const DEFAULT_MAX_BYTES = 750 * 1024; // ~0.75 MB — safe under common 1–2 MB proxies
const DEFAULT_QUALITY = 0.82;

export type CompressImageOptions = {
  maxEdge?: number;
  maxBytes?: number;
  quality?: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Şəkil oxunmadı"));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

function outputName(original: string, ext: string): string {
  const base = original.replace(/\.[^.]+$/, "") || "image";
  return `${base}.${ext}`;
}

/**
 * Returns a JPEG/WebP File small enough for typical shared-hosting limits.
 * Falls back to the original file if compression is not possible.
 */
export async function compressImageForUpload(
  file: File,
  options: CompressImageOptions = {},
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  // Animated GIF / SVG — leave alone
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  let quality = options.quality ?? DEFAULT_QUALITY;

  try {
    const img = await loadImage(file);
    const srcW = img.naturalWidth || img.width;
    const srcH = img.naturalHeight || img.height;
    if (srcW <= 0 || srcH <= 0) {
      return file;
    }

    const scale = Math.min(1, maxEdge / Math.max(srcW, srcH));
    const width = Math.max(1, Math.round(srcW * scale));
    const height = Math.max(1, Math.round(srcH * scale));

    // Already small enough and not oversized dimensions — keep original
    if (file.size <= maxBytes && scale === 1) {
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return file;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const preferWebp =
      typeof canvas.toDataURL === "function" &&
      canvas.toDataURL("image/webp").startsWith("data:image/webp");
    const mime = preferWebp ? "image/webp" : "image/jpeg";
    const ext = preferWebp ? "webp" : "jpg";

    let blob: Blob | null = await canvasToBlob(canvas, mime, quality);
    let guard = 0;
    while (blob && blob.size > maxBytes && quality > 0.45 && guard < 8) {
      quality = Math.max(0.45, quality - 0.1);
      blob = await canvasToBlob(canvas, mime, quality);
      guard += 1;
    }

    // Still too big — shrink dimensions further
    if (blob && blob.size > maxBytes) {
      let edge = Math.round(maxEdge * 0.75);
      while (blob && blob.size > maxBytes && edge >= 960) {
        const s = Math.min(1, edge / Math.max(srcW, srcH));
        canvas.width = Math.max(1, Math.round(srcW * s));
        canvas.height = Math.max(1, Math.round(srcH * s));
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        blob = await canvasToBlob(canvas, mime, 0.72);
        edge = Math.round(edge * 0.8);
      }
    }

    if (!blob) {
      return file;
    }

    // Prefer compressed when smaller; otherwise keep original
    if (blob.size >= file.size && scale === 1) {
      return file;
    }

    return new File([blob], outputName(file.name, ext), {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/** Stronger pass used when the server still returns 413. */
export async function compressImageAggressive(file: File): Promise<File> {
  return compressImageForUpload(file, {
    maxEdge: 1280,
    maxBytes: 450 * 1024,
    quality: 0.7,
  });
}

export function uploadTooLargeMessage(status: number): string | null {
  if (status === 413) {
    return "Şəkil həcmi server limitini keçdi. Avtomatik kiçildilib yenidən cəhd edilir…";
  }
  return null;
}

export function httpStatusMessage(status: number): string {
  if (status === 413) {
    return "Şəkil çox böyükdür. Daha kiçik şəkil seçin və ya yenidən cəhd edin.";
  }
  if (status === 0) {
    return "Şəbəkə xətası. İnternet bağlantınızı yoxlayın.";
  }
  return `Server xətası (HTTP ${status})`;
}
