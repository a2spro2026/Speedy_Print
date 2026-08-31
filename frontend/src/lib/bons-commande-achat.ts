import {
  TYPES_REGLEMENT,
  normalizeTypeReglement,
  type TypeReglement,
} from "@/lib/fournisseurs";
import {
  calcSousTotal,
  emptyLigne,
  type LigneFactureAchat,
  type TypeFacture,
} from "@/lib/factures-achat";

export type LigneBonCommandeAchat = LigneFactureAchat;

export type BonCommandeAchat = {
  id: string; // BCA-xxxx
  mois: string;
  date: string;
  typeFacture: TypeFacture;
  numeroBonCmd: string;
  fournisseurId: string;
  nomFournisseur: string;
  ice: string;
  typeReglement: TypeReglement;
  echeance: string;
  lignes: LigneBonCommandeAchat[];
  montantTotal: number;
};

const STORAGE_KEY = "speedyprint.bons-commande-achat";

export { TYPES_REGLEMENT };
export type { TypeReglement };
export { calcSousTotal, emptyLigne };
export type { TypeFacture };

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

export const TYPES_FACTURE: TypeFacture[] = ["Exonéré", "HT", "TTC"];
export const UNITES = ["U", "Kg", "L", "M", "M²", "M³", "Lot", "Hrs"];

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
  return `BCA-${String(n).padStart(4, "0")}`;
}

export function nextBonCommandeId(existing: BonCommandeAchat[]): string {
  let max = 0;
  for (const b of existing) {
    const m = /^BCA-(\d+)$/.exec(b.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

export function normalizeNumeroBonCmd(raw: string): string {
  const s = (raw || "").trim();
  const m =
    /^(\d+)-BCA$/i.exec(s) ||
    /^BCA-?(\d+)$/i.exec(s) ||
    /^BC-?(\d+)$/i.exec(s);
  if (m) return `${String(Number(m[1])).padStart(4, "0")}-BCA`;
  return s;
}

export function nextNumeroBonCmd(existing: BonCommandeAchat[]): string {
  let max = 0;
  for (const b of existing) {
    const raw = normalizeNumeroBonCmd(b.numeroBonCmd || "");
    const m = /^(\d+)-BCA$/i.exec(raw);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${String(max + 1).padStart(4, "0")}-BCA`;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function totalBonCommande(lignes: LigneBonCommandeAchat[]): number {
  return round2(lignes.reduce((s, l) => s + (Number(l.sousTotal) || 0), 0));
}

export function loadBonsCommandeAchat(): BonCommandeAchat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BonCommandeAchat[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b) => ({
      ...b,
      typeReglement: normalizeTypeReglement(b.typeReglement),
      lignes:
        Array.isArray(b.lignes) && b.lignes.length > 0
          ? b.lignes
          : [emptyLigne()],
      montantTotal: Number(b.montantTotal) || 0,
      numeroBonCmd: normalizeNumeroBonCmd(b.numeroBonCmd ?? ""),
    }));
  } catch {
    return [];
  }
}

export function saveBonsCommandeAchat(list: BonCommandeAchat[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
