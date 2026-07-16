import {
  TYPES_REGLEMENT,
  applyClientSoldeDelta,
  normalizeTypeReglement,
  type TypeReglement,
} from "@/lib/clients";
import type { Devis } from "@/lib/devis";

export type TypeFacture = "Exonéré" | "HT" | "TTC";
export type BaseFacture = "Vente" | "Avoir";

export type LigneFactureVente = {
  ref: string;
  designation: string;
  qte: number;
  unite: string;
  prixU: number;
  remise: number; // %
  tva: number; // %
  sousTotal: number;
};

export type FactureVente = {
  id: string; // FV-xxxx
  mois: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  typeFacture: TypeFacture;
  base: BaseFacture;
  numeroFacture: string;
  clientId: string;
  nomClient: string;
  ice: string;
  typeReglement: TypeReglement;
  echeance: string; // YYYY-MM-DD
  lignes: LigneFactureVente[];
  montantFacture: number;
  devisId?: string; // DV-xxxx si converti depuis un devis
};

const STORAGE_KEY = "speedyprint.factures-vente";

export const TYPES_FACTURE: TypeFacture[] = ["Exonéré", "HT", "TTC"];
export const BASES_FACTURE: BaseFacture[] = ["Vente", "Avoir"];
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
  return `FV-${String(n).padStart(4, "0")}`;
}

export function nextFactureVenteId(existing: FactureVente[]): string {
  let max = 0;
  for (const f of existing) {
    const m = /^FV-(\d+)$/.exec(f.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

/** Année courte pour le n° : 2026 → 26 */
function yearSuffix(dateISO?: string): string {
  const y = dateISO?.slice(0, 4) || String(new Date().getFullYear());
  return y.slice(-2);
}

/** N° facture affiché : FC-26/0001, FC-26/0002… */
export function nextNumeroFacture(
  existing: FactureVente[],
  dateISO?: string
): string {
  const yy = yearSuffix(dateISO);
  const re = new RegExp(`^FC-${yy}/(\\d+)$`, "i");
  let max = 0;
  for (const f of existing) {
    const m = re.exec((f.numeroFacture || "").trim());
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `FC-${yy}/${String(max + 1).padStart(4, "0")}`;
}

export function isDevisConverted(
  devisId: string,
  existing: FactureVente[]
): boolean {
  return existing.some((f) => f.devisId === devisId);
}

/** Crée une facture vente à partir d'un devis. */
export function factureFromDevis(
  devis: Devis,
  existing: FactureVente[]
): FactureVente {
  const numeroFacture = nextNumeroFacture(existing, devis.date);
  const lignes: LigneFactureVente[] = (devis.lignes ?? []).map((l) => ({
    ref: l.ref ?? "",
    designation: l.designation,
    qte: Number(l.qte) || 0,
    unite: l.unite,
    prixU: Number(l.prixU) || 0,
    remise: Number(l.remise) || 0,
    tva: Number(l.tva) || 0,
    sousTotal: Number(l.sousTotal) || 0,
  }));

  return {
    id: nextFactureVenteId(existing),
    mois: devis.mois,
    date: devis.date,
    typeFacture: devis.typeFacture,
    base: "Vente",
    numeroFacture,
    clientId: devis.clientId,
    nomClient: devis.nomClient,
    ice: devis.ice ?? "",
    typeReglement: devis.typeReglement,
    echeance: devis.echeance,
    lignes: lignes.length ? lignes : [emptyLigne()],
    montantFacture: devis.montantFacture,
    devisId: devis.id,
  };
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

export function totalFacture(lignes: LigneFactureVente[]): number {
  return round2(lignes.reduce((s, l) => s + (Number(l.sousTotal) || 0), 0));
}

export function emptyLigne(): LigneFactureVente {
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

export function loadFacturesVente(): FactureVente[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FactureVente[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((f) => ({
      ...f,
      typeReglement: normalizeTypeReglement(f.typeReglement),
      lignes:
        Array.isArray(f.lignes) && f.lignes.length > 0 ? f.lignes : [emptyLigne()],
      montantFacture: Number(f.montantFacture) || 0,
    }));
  } catch {
    return [];
  }
}

export function saveFacturesVente(list: FactureVente[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/** Qté vendue d'un produit (réf) depuis les factures de vente. Avoir = négatif. */
export function qteVendueProduit(produitRef: string): number {
  const ref = produitRef.trim().toLowerCase();
  if (!ref) return 0;
  let total = 0;
  for (const f of loadFacturesVente()) {
    const sign = f.base === "Avoir" ? -1 : 1;
    for (const l of f.lignes ?? []) {
      if ((l.ref || "").trim().toLowerCase() === ref) {
        total += sign * (Number(l.qte) || 0);
      }
    }
  }
  return total;
}

/** Impact sur le solde client : + vente, − avoir. */
export function soldeImpactFacture(
  montantFacture: number,
  base: BaseFacture
): number {
  const m = Number(montantFacture) || 0;
  return base === "Avoir" ? -m : m;
}

export function syncClientSoldeOnFactureCreate(facture: FactureVente): void {
  applyClientSoldeDelta(
    facture.clientId,
    soldeImpactFacture(facture.montantFacture, facture.base)
  );
}

export function syncClientSoldeOnFactureDelete(facture: FactureVente): void {
  applyClientSoldeDelta(
    facture.clientId,
    -soldeImpactFacture(facture.montantFacture, facture.base)
  );
}

export function syncClientSoldeOnFactureEdit(
  prev: FactureVente,
  next: FactureVente
): void {
  const prevImpact = soldeImpactFacture(prev.montantFacture, prev.base);
  const nextImpact = soldeImpactFacture(next.montantFacture, next.base);

  if (prev.clientId === next.clientId) {
    applyClientSoldeDelta(next.clientId, nextImpact - prevImpact);
    return;
  }

  applyClientSoldeDelta(prev.clientId, -prevImpact);
  applyClientSoldeDelta(next.clientId, nextImpact);
}
