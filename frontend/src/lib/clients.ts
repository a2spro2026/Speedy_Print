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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Client[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c) => ({
      ...c,
      typeReglement: normalizeTypeReglement(c.typeReglement),
      soldeInitial: Number(c.soldeInitial) || 0,
    }));
  } catch {
    return [];
  }
}

export function saveClients(list: Client[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
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
