import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

type ImageItem = { path?: string; url?: string };

function resolvePhpBin(): string {
  return process.env.EVVA_PHP_BIN || "C:\\xampp\\php\\php.exe";
}

function resolveGalleryScript(): string {
  return (
    process.env.EVVA_GALLERY_CLI ||
    path.join(process.cwd(), "..", "backend", "public", "gallery-cli.php")
  );
}

function stdoutToText(stdout: string | Buffer): string {
  return typeof stdout === "string" ? stdout : Buffer.from(stdout).toString("utf8");
}

export async function loadGalleryViaPhpCli(id: number): Promise<ImageItem[]> {
  if (!Number.isFinite(id) || id <= 0) return [];

  try {
    const { stdout } = await execFileAsync(
      resolvePhpBin(),
      [resolveGalleryScript(), String(id)],
      {
        windowsHide: true,
        timeout: 20000,
        maxBuffer: 2 * 1024 * 1024,
        env: {
          ...process.env,
          EVVA_FORCE_REMOTE_DB: "1",
        },
      },
    );

    const text = stdoutToText(stdout).trim();
    const jsonStart = text.indexOf("{");
    if (jsonStart < 0) return [];
    const parsed = JSON.parse(text.slice(jsonStart)) as {
      success?: boolean;
      data?: { images?: ImageItem[] };
    };
    if (!parsed.success || !Array.isArray(parsed.data?.images)) return [];
    return parsed.data.images.filter((img) => Boolean(img.path || img.url));
  } catch {
    return [];
  }
}
