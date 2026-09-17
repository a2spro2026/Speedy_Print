import { BUSINESS_STORAGE_KEYS } from "@/lib/business-storage-keys";

const cache: Record<string, unknown> = {};
let hydrated = false;
let hydratePromise: Promise<void> | null = null;

function hasStoredData(value: unknown): boolean {
  if (value == null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value as object).length > 0;
  return true;
}

function readLocalStorage(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

async function uploadPatch(patch: Record<string, unknown>): Promise<void> {
  const res = await fetch("/api/store", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
}

/** Charge les données depuis le serveur (partagées entre tous les utilisateurs). */
export async function hydrateBusinessStore(): Promise<void> {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    if (typeof window === "undefined") return;

    let server: Record<string, unknown> = {};
    try {
      const res = await fetch("/api/store", { cache: "no-store" });
      if (res.ok) {
        server = (await res.json()) as Record<string, unknown>;
      }
    } catch {
      /* hors ligne : localStorage uniquement */
    }

    const migration: Record<string, unknown> = {};

    for (const key of BUSINESS_STORAGE_KEYS) {
      const fromServer = server[key];
      if (hasStoredData(fromServer)) {
        cache[key] = fromServer;
        writeLocalStorage(key, fromServer);
        continue;
      }

      const fromLocal = readLocalStorage(key);
      if (hasStoredData(fromLocal)) {
        cache[key] = fromLocal;
        migration[key] = fromLocal;
      }
    }

    if (Object.keys(migration).length > 0) {
      try {
        await uploadPatch(migration);
      } catch {
        /* garde le cache local ; réessaiera au prochain save */
      }
    }

    hydrated = true;
  })();

  return hydratePromise;
}

/** Recharge depuis le serveur (ex. autre onglet / autre poste). */
export async function refreshBusinessStore(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    const res = await fetch("/api/store", { cache: "no-store" });
    if (!res.ok) return;
    const server = (await res.json()) as Record<string, unknown>;
    for (const key of BUSINESS_STORAGE_KEYS) {
      if (server[key] !== undefined) {
        cache[key] = server[key];
        writeLocalStorage(key, server[key]);
      }
    }
    hydrated = true;
    window.dispatchEvent(new CustomEvent("speedyprint:data-updated"));
  } catch {
    /* ignore */
  }
}

export function isBusinessStoreReady(): boolean {
  return hydrated;
}

export function readJsonStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  if (key in cache) {
    return cache[key] as T;
  }

  const local = readLocalStorage(key);
  if (local !== null) {
    cache[key] = local;
    return local as T;
  }

  return fallback;
}

export function writeJsonStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;

  // Garde-fou local : ne pas pousser [] si on avait déjà des données.
  if (Array.isArray(value) && value.length === 0) {
    const prev =
      key in cache ? cache[key] : readLocalStorage(key);
    if (Array.isArray(prev) && prev.length > 0) {
      console.warn(
        `[business-store] refuse empty overwrite for ${key} (kept ${prev.length} items)`
      );
      return;
    }
  }

  cache[key] = value;
  writeLocalStorage(key, value);

  void fetch("/api/store", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ [key]: value }),
  })
    .then(() => {
      window.dispatchEvent(new CustomEvent("speedyprint:data-updated"));
    })
    .catch(() => {
      /* cache + localStorage conservés */
    });
}
