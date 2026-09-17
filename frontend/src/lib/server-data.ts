import fs from "fs/promises";
import path from "path";
import {
  BUSINESS_STORAGE_KEYS,
  isBusinessStorageKey,
} from "@/lib/business-storage-keys";

export { BUSINESS_STORAGE_KEYS };

export function getDataDirectory(): string {
  if (process.env.SPEEDYPRINT_DATA_DIR) {
    return process.env.SPEEDYPRINT_DATA_DIR;
  }
  return path.join(process.cwd(), "data");
}

async function ensureDataDir(): Promise<string> {
  const dir = getDataDirectory();
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

function filePathForKey(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9._-]/g, "");
  return path.join(getDataDirectory(), `${safe}.json`);
}

export async function readStoreKey(key: string): Promise<unknown | null> {
  if (!isBusinessStorageKey(key)) return null;
  try {
    const raw = await fs.readFile(filePathForKey(key), "utf-8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function writeStoreKey(
  key: string,
  value: unknown
): Promise<void> {
  if (!isBusinessStorageKey(key)) return;
  await ensureDataDir();
  await fs.writeFile(filePathForKey(key), JSON.stringify(value), "utf-8");
}

export async function readAllStore(): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = {};
  for (const key of BUSINESS_STORAGE_KEYS) {
    const val = await readStoreKey(key);
    if (val !== null) out[key] = val;
  }
  return out;
}

export async function writeStorePatch(
  patch: Record<string, unknown>
): Promise<void> {
  await ensureDataDir();
  for (const [key, value] of Object.entries(patch)) {
    if (!isBusinessStorageKey(key)) continue;

    // Ne jamais écraser une liste non vide par [] (course locale / onglet stale).
    if (Array.isArray(value) && value.length === 0) {
      const prev = await readStoreKey(key);
      if (Array.isArray(prev) && prev.length > 0) {
        console.warn(
          `[server-data] ignore empty overwrite for ${key} (kept ${prev.length} items)`
        );
        continue;
      }
    }

    await writeStoreKey(key, value);
  }
}
