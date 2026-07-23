import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";

const execFileAsync = promisify(execFile);

export type InboxConversation = {
  id: number;
  property_id: number;
  property_title: string;
  status: string;
  guest_name: string;
  owner_name: string;
  last_message: string;
  unread_count?: number;
  updated_at: string;
};

function resolvePhpBin(): string {
  return process.env.EVVA_PHP_BIN || "C:\\xampp\\php\\php.exe";
}

function resolveInboxScript(): string {
  return (
    process.env.EVVA_CHAT_INBOX_CLI ||
    path.join(process.cwd(), "..", "backend", "public", "chat-inbox-cli.php")
  );
}

function stdoutToText(stdout: string | Buffer): string {
  return typeof stdout === "string" ? stdout : Buffer.from(stdout).toString("utf8");
}

export async function loadInboxViaPhpCli(userId: number): Promise<InboxConversation[]> {
  if (!Number.isFinite(userId) || userId <= 0) return [];

  try {
    const { stdout } = await execFileAsync(
      resolvePhpBin(),
      [resolveInboxScript(), String(userId)],
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
      data?: { items?: InboxConversation[] };
    };
    if (!parsed.success || !Array.isArray(parsed.data?.items)) return [];
    return parsed.data.items;
  } catch {
    return [];
  }
}
