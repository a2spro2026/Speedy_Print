import {
  TYPES_REGLEMENT,
  normalizeTypeReglement,
  type TypeReglement,
} from "@/lib/clients";

export type ReglementClient = {
  id: string; // RGC-xxxx
  date: string;
  factureId: string; // FV-xxxx
  refFacture: string;
  clientId: string;
  nomClient: string;
  montantFacture: number;
  montantPaye: number;
  solde: number;
  modeReglement: TypeReglement;
  numeroRegl: string;
  bnqRegl: string;
  nomTire: string;
  dateEncaisse: string;
  statut: "Oui" | "Non";
};

const STORAGE_KEY = "speedyprint.reglements-client";

export { TYPES_REGLEMENT };

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
  return `RGC-${String(n).padStart(4, "0")}`;
}

export function nextReglementId(existing: ReglementClient[]): string {
  let max = 0;
  for (const r of existing) {
    const m = /^RGC-(\d+)$/.exec(r.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcSolde(montantFacture: number, montantPaye: number): number {
  return round2(montantFacture - montantPaye);
}

export function loadReglementsClient(): ReglementClient[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<ReglementClient>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => {
      const montantFacture = Number(r.montantFacture) || 0;
      const montantPaye =
        r.montantPaye != null ? Number(r.montantPaye) || 0 : montantFacture;
      const solde =
        r.solde != null
          ? Number(r.solde) || 0
          : calcSolde(montantFacture, montantPaye);
      return {
        id: r.id || "",
        date: r.date || todayISO(),
        factureId: r.factureId || "",
        refFacture: r.refFacture || "",
        clientId: r.clientId || "",
        nomClient: r.nomClient || "",
        montantFacture,
        montantPaye,
        solde,
        modeReglement: normalizeTypeReglement(r.modeReglement || "Vir"),
        numeroRegl: r.numeroRegl || "",
        bnqRegl: r.bnqRegl || "",
        nomTire: r.nomTire || "",
        dateEncaisse: r.dateEncaisse || todayISO(),
        statut: r.statut === "Oui" || r.statut === "Non" ? r.statut : "Non",
      };
    });
  } catch {
    return [];
  }
}

export function saveReglementsClient(list: ReglementClient[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
