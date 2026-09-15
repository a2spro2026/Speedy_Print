import { readJsonStore, writeJsonStore } from "@/lib/business-store";

export type TypeReglement =
  | "Esp"
  | "Chq"
  | "Vir"
  | "Eff"
  | "Vers"
  | "Autre";

export type Fournisseur = {
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

const STORAGE_KEY = "speedyprint.fournisseurs";

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
  return `FRN-${String(n).padStart(4, "0")}`;
}

export function nextFournisseurId(existing: Fournisseur[]): string {
  let max = 0;
  for (const f of existing) {
    const m = /^FRN-(\d+)$/.exec(f.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

export function loadFournisseurs(): Fournisseur[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJsonStore<Fournisseur[]>(STORAGE_KEY, []);
    if (!Array.isArray(parsed)) return [];
    const mapped = parsed.map((f) => ({
      ...f,
      nom: String(f.nom ?? "").trim().replace(/\s+/g, " "),
      typeReglement: normalizeTypeReglement(f.typeReglement),
      soldeInitial: Number(f.soldeInitial) || 0,
    }));
    const deduped = dedupeFournisseursByNom(mapped);
    if (deduped.length !== mapped.length) {
      writeJsonStore(STORAGE_KEY, deduped);
    }
    return deduped;
  } catch {
    return [];
  }
}

export function saveFournisseurs(list: Fournisseur[]): void {
  writeJsonStore(STORAGE_KEY, list);
}

/** Normalise un nom pour détecter les doublons (casse, espaces, accents). */
export function normalizeNomFournisseur(nom: string): string {
  return nom
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Fusionne les fiches qui partagent le même nom normalisé. */
export function dedupeFournisseursByNom(list: Fournisseur[]): Fournisseur[] {
  const byKey = new Map<string, Fournisseur>();
  const order: string[] = [];

  for (const f of list) {
    const key = normalizeNomFournisseur(f.nom);
    if (!key) continue;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, { ...f, nom: f.nom.trim().replace(/\s+/g, " ") });
      order.push(key);
      continue;
    }
    byKey.set(key, {
      ...prev,
      nom: prev.nom.trim().replace(/\s+/g, " "),
      contact: prev.contact || f.contact,
      ville: prev.ville || f.ville,
      typeReglement: prev.typeReglement || f.typeReglement,
      banque: prev.banque || f.banque,
      rc: prev.rc || f.rc,
      ice: prev.ice || f.ice,
      rib: prev.rib || f.rib,
      soldeInitial: prev.soldeInitial || f.soldeInitial,
      date: prev.date <= f.date ? prev.date : f.date,
    });
  }

  return order.map((k) => byKey.get(k)!);
}

/**
 * Crée ou met à jour une fiche fournisseur à partir d'un bon de commande
 * ou d'une facture d'achat. Le nom (normalisé) prime pour éviter les doublons.
 */
export function upsertFournisseurFromDocument(args: {
  fournisseurId?: string;
  nom: string;
  ice?: string;
  typeReglement?: TypeReglement;
  date?: string;
}): Fournisseur {
  const list = dedupeFournisseursByNom(loadFournisseurs());
  const nom = args.nom.trim().replace(/\s+/g, " ");
  const ice = (args.ice ?? "").trim();
  const nomKey = normalizeNomFournisseur(nom);

  // 1) Anti-doublon : priorité au nom (même écriture / casse / accents)
  let existing = nomKey
    ? list.find((f) => normalizeNomFournisseur(f.nom) === nomKey)
    : undefined;

  // 2) Sinon, reprendre la fiche liée à l'ID du document (renommage)
  if (!existing && args.fournisseurId) {
    existing = list.find((f) => f.id === args.fournisseurId);
  }

  if (existing) {
    const updated: Fournisseur = {
      ...existing,
      nom,
      ice: ice || existing.ice,
      typeReglement: args.typeReglement ?? existing.typeReglement,
    };
    const next = list.map((f) => (f.id === existing!.id ? updated : f));
    saveFournisseurs(dedupeFournisseursByNom(next));
    return updated;
  }

  const created: Fournisseur = {
    id: nextFournisseurId(list),
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
  saveFournisseurs([created, ...list]);
  return created;
}
