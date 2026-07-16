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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Fournisseur[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f) => ({
      ...f,
      typeReglement: normalizeTypeReglement(f.typeReglement),
      soldeInitial: Number(f.soldeInitial) || 0,
    }));
  } catch {
    return [];
  }
}

export function saveFournisseurs(list: Fournisseur[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
