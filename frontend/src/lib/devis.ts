import { TYPES_REGLEMENT, normalizeTypeReglement, type TypeReglement } from "@/lib/clients";

export type TypeFacture = "Exonéré" | "HT" | "TTC";
export type BaseDevis = "Devis";

export type LigneDevis = {
  ref: string;
  designation: string;
  qte: number;
  unite: string;
  prixU: number;
  remise: number;
  tva: number;
  sousTotal: number;
};

export type Devis = {
  id: string; // DV-xxxx
  mois: string;
  date: string;
  typeFacture: TypeFacture;
  base: BaseDevis;
  numeroDevis: string;
  clientId: string;
  nomClient: string;
  ice: string;
  typeReglement: TypeReglement;
  echeance: string;
  lignes: LigneDevis[];
  montantFacture: number;
};

const STORAGE_KEY = "speedyprint.devis";

export const TYPES_FACTURE: TypeFacture[] = ["Exonéré", "HT", "TTC"];
export const BASES_DEVIS: BaseDevis[] = ["Devis"];
export const UNITES = ["U", "Kg", "L", "M", "M²", "M³", "Lot", "Hrs"];
export { TYPES_REGLEMENT };
export type { TypeReglement };

const MOIS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function moisLabel(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-");
  const idx = Number(m) - 1;
  if (!y || idx < 0 || idx > 11) return yyyyMm;
  return `${MOIS_FR[idx]} ${y}`;
}

export function moisOptions(): { value: string; label: string }[] {
  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() - 1];
  const opts: { value: string; label: string }[] = [];
  for (const y of years) {
    for (let m = 1; m <= 12; m++) {
      const value = `${y}-${String(m).padStart(2, "0")}`;
      opts.push({ value, label: moisLabel(value) });
    }
  }
  return opts;
}

export function moisFromDate(isoDate: string): string {
  return isoDate.slice(0, 7);
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
  return `DV-${String(n).padStart(4, "0")}`;
}

export function nextDevisId(existing: Devis[]): string {
  let max = 0;
  for (const d of existing) {
    const m = /^DV-(\d+)$/.exec(d.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

/** N° devis affiché : Dev0001, Dev0002… */
export function nextNumeroDevis(existing: Devis[]): string {
  let max = 0;
  for (const d of existing) {
    const m = /^Dev(\d+)$/i.exec((d.numeroDevis || "").trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `Dev${String(max + 1).padStart(4, "0")}`;
}

export function calcSousTotal(args: {
  qte: number;
  prixU: number;
  remise: number;
  tva: number;
  typeFacture: TypeFacture;
}): number {
  const qte = Number.isFinite(args.qte) ? args.qte : 0;
  const prixU = Number.isFinite(args.prixU) ? args.prixU : 0;
  const remise = Number.isFinite(args.remise) ? args.remise : 0;
  const tva = Number.isFinite(args.tva) ? args.tva : 0;
  const brut = qte * prixU;
  const apresRemise = brut * (1 - Math.min(Math.max(remise, 0), 100) / 100);
  if (args.typeFacture === "Exonéré") return round2(apresRemise);
  const montantTva = apresRemise * (Math.max(tva, 0) / 100);
  if (args.typeFacture === "HT") return round2(apresRemise);
  return round2(apresRemise + montantTva);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function totalDevis(lignes: LigneDevis[]): number {
  return round2(lignes.reduce((s, l) => s + (Number(l.sousTotal) || 0), 0));
}

export function emptyLigne(): LigneDevis {
  return {
    ref: "",
    designation: "",
    qte: 1,
    unite: "U",
    prixU: 0,
    remise: 0,
    tva: 20,
    sousTotal: 0,
  };
}

export function loadDevis(): Devis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Devis[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d) => ({
      ...d,
      base: "Devis",
      typeReglement: normalizeTypeReglement(d.typeReglement),
      lignes:
        Array.isArray(d.lignes) && d.lignes.length > 0 ? d.lignes : [emptyLigne()],
      montantFacture: Number(d.montantFacture) || 0,
    }));
  } catch {
    return [];
  }
}

export function saveDevis(list: Devis[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
