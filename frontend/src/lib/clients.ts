import { readJsonStore, writeJsonStore } from "@/lib/business-store";

export type TypeReglement =
  | "Esp"
  | "Chq"
  | "Vir"
  | "Eff"
  | "Vers"
  | "Autre";

export type Client = {
  id: string;
  date: string; // YYYY-MM-DD
  nom: string;
  contact: string;
  ville: string;
  typeReglement: TypeReglement;
  banque: string;
  rc: string;
  ice: string;
  rib: string;
  soldeInitial: number;
};

const STORAGE_KEY = "speedyprint.clients";

export const TYPES_REGLEMENT: TypeReglement[] = [
  "Esp",
  "Chq",
  "Vir",
  "Eff",
  "Vers",
  "Autre",
];

/** Migre les anciens libellés vers Esp/Chq/Vir/Eff/Vers. */
export function normalizeTypeReglement(
  value: string | null | undefined
): TypeReglement {
  const map: Record<string, TypeReglement> = {
    Espèces: "Esp",
    Especes: "Esp",
    Esp: "Esp",
    Chèque: "Chq",
    Cheque: "Chq",
    Chq: "Chq",
    Virement: "Vir",
    Vir: "Vir",
    Traite: "Eff",
    Eff: "Eff",
    Vers: "Vers",
    Autre: "Autre",
  };
  return map[value ?? ""] ?? "Vir";
}

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function padId(n: number): string {
  return `CLI-${String(n).padStart(4, "0")}`;
}

export function nextClientId(existing: Client[]): string {
  let max = 0;
  for (const c of existing) {
    const m = /^CLI-(\d+)$/.exec(c.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

export function loadClients(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJsonStore<Client[]>(STORAGE_KEY, []);
    if (!Array.isArray(parsed)) return [];
    const mapped = parsed.map((c) => ({
      ...c,
      nom: String(c.nom ?? "").trim().replace(/\s+/g, " "),
      typeReglement: normalizeTypeReglement(c.typeReglement),
      soldeInitial: Number(c.soldeInitial) || 0,
    }));
    const deduped = dedupeClientsByNom(mapped);
    if (deduped.length !== mapped.length) {
      writeJsonStore(STORAGE_KEY, deduped);
    }
    return deduped;
  } catch {
    return [];
  }
}

export function saveClients(list: Client[]): void {
  writeJsonStore(STORAGE_KEY, list);
}

/** Normalise un nom pour détecter les doublons (casse, espaces, accents). */
export function normalizeNomClient(nom: string): string {
  return nom
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Fusionne les fiches qui partagent le même nom normalisé. */
export function dedupeClientsByNom(list: Client[]): Client[] {
  const byKey = new Map<string, Client>();
  const order: string[] = [];

  for (const c of list) {
    const key = normalizeNomClient(c.nom);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...c, nom: c.nom.trim().replace(/\s+/g, " ") });
      order.push(key);
      continue;
    }
    byKey.set(key, {
      ...prev,
      nom: prev.nom.trim().replace(/\s+/g, " "),
      contact: prev.contact || c.contact,
      ville: prev.ville || c.ville,
      typeReglement: prev.typeReglement || c.typeReglement,
      banque: prev.banque || c.banque,
      rc: prev.rc || c.rc,
      ice: prev.ice || c.ice,
      rib: prev.rib || c.rib,
      soldeInitial: prev.soldeInitial || c.soldeInitial,
      date: prev.date <= c.date ? prev.date : c.date,
    });
  }

  return order.map((k) => byKey.get(k)!);
}

/**
 * Crée ou met à jour une fiche client à partir d'un devis / facture.
 * Le nom (normalisé) prime pour éviter les doublons.
 */
export function upsertClientFromDocument(args: {
  clientId?: string;
  nom: string;
  ice?: string;
  typeReglement?: TypeReglement;
  date?: string;
}): Client {
  const list = dedupeClientsByNom(loadClients());
  const nom = args.nom.trim().replace(/\s+/g, " ");
  const ice = (args.ice ?? "").trim();
  const nomKey = normalizeNomClient(nom);

  let existing = nomKey
    ? list.find((c) => normalizeNomClient(c.nom) === nomKey)
    : undefined;

  if (!existing && args.clientId) {
    existing = list.find((c) => c.id === args.clientId);
  }

  if (existing) {
    const updated: Client = {
      ...existing,
      nom,
      ice: ice || existing.ice,
      typeReglement: args.typeReglement ?? existing.typeReglement,
    };
    const next = list.map((c) => (c.id === existing!.id ? updated : c));
    saveClients(dedupeClientsByNom(next));
    return updated;
  }

  const created: Client = {
    id: nextClientId(list),
    date: args.date || todayISO(),
    nom,
    contact: "",
    ville: "",
    typeReglement: args.typeReglement ?? "Vir",
    banque: "",
    rc: "",
    ice,
    rib: "",
    soldeInitial: 0,
  };
  saveClients([created, ...list]);
  return created;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Augmente ou diminue le solde initial d'un client (delta + ou -). */
export function applyClientSoldeDelta(clientId: string, delta: number): void {
  if (!clientId || !Number.isFinite(delta) || delta === 0) return;
  const clients = loadClients();
  const idx = clients.findIndex((c) => c.id === clientId);
  if (idx < 0) return;
  const next = [...clients];
  next[idx] = {
    ...next[idx],
    soldeInitial: round2(next[idx].soldeInitial + delta),
  };
  saveClients(next);
}
