import { TYPES_REGLEMENT, normalizeTypeReglement, type TypeReglement } from "@/lib/fournisseurs";

export type TypeFacture = "Exonéré" | "HT" | "TTC";
export type BaseFacture = "Achat" | "Avoir";

export type LigneFactureAchat = {
  ref: string;
  designation: string;
  qte: number;
  unite: string;
  prixU: number;
  remise: number; // %
  tva: number; // %
  sousTotal: number;
};

export type FactureAchat = {
  id: string; // ID interne FA-xxxx
  mois: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  typeFacture: TypeFacture;
  base: BaseFacture;
  numeroFacture: string;
  fournisseurId: string;
  nomFournisseur: string;
  ice: string;
  typeReglement: TypeReglement;
  echeance: string; // YYYY-MM-DD
  lignes: LigneFactureAchat[];
  montantFacture: number; // total des sous-totaux
};

const STORAGE_KEY = "speedyprint.factures-achat";

export const TYPES_FACTURE: TypeFacture[] = ["Exonéré", "HT", "TTC"];
export const BASES_FACTURE: BaseFacture[] = ["Achat", "Avoir"];
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
  return `FA-${String(n).padStart(4, "0")}`;
}

export function nextFactureAchatId(existing: FactureAchat[]): string {
  let max = 0;
  for (const f of existing) {
    const m = /^FA-(\d+)$/.exec(f.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
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

export function totalFacture(lignes: LigneFactureAchat[]): number {
  return round2(lignes.reduce((s, l) => s + (Number(l.sousTotal) || 0), 0));
}

export function emptyLigne(): LigneFactureAchat {
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

export function loadFacturesAchat(): FactureAchat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FactureAchat[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f) => ({
      ...f,
      typeReglement: normalizeTypeReglement(f.typeReglement),
      lignes: Array.isArray(f.lignes) && f.lignes.length > 0 ? f.lignes : [emptyLigne()],
      montantFacture: Number(f.montantFacture) || 0,
    }));
  } catch {
    return [];
  }
}

export function saveFacturesAchat(list: FactureAchat[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Qté achetée d'un produit (réf) depuis les factures d'achat. Avoir = négatif. */
export function qteAcheteeProduit(produitRef: string): number {
  const ref = produitRef.trim().toLowerCase();
  if (!ref) return 0;
  let total = 0;
  for (const f of loadFacturesAchat()) {
    const sign = f.base === "Avoir" ? -1 : 1;
    for (const l of f.lignes ?? []) {
      if ((l.ref || "").trim().toLowerCase() === ref) {
        total += sign * (Number(l.qte) || 0);
      }
    }
  }
  return total;
}

/** Stock final = stock initial + achats (sans ventes). Preferer stockFinalBalance. */
export function stockFinalProduit(
  qteInitiale: number,
  produitRef: string
): number {
  return (Number(qteInitiale) || 0) + qteAcheteeProduit(produitRef);
}
