import {
  TYPES_REGLEMENT,
  applyClientSoldeDelta,
  normalizeTypeReglement,
  type TypeReglement,
} from "@/lib/clients";
import { readJsonStore, writeJsonStore } from "@/lib/business-store";
import type { Devis } from "@/lib/devis";
import { qteLivreeProduit, type BonLivraison } from "@/lib/bons-livraison";

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
  /** BL d'origine : la sortie de stock est déjà comptée par le BL. */
  blId?: string;
};

export type FactureVente = {
  id: string; // FV-xxxx
  mois: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  typeFacture: TypeFacture;
  base: BaseFacture;
  numeroFacture: string;
  bonCmdNumero: string; // Bon Cmd N° (saisie manuelle, ex. BC-…)
  clientId: string;
  nomClient: string;
  ice: string;
  typeReglement: TypeReglement;
  echeance: string; // YYYY-MM-DD
  lignes: LigneFactureVente[];
  montantFacture: number;
  devisId?: string; // DV-xxxx si converti depuis un devis
  blIds?: string[]; // BL-xxxx si converti depuis un ou plusieurs BL
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

/** N° facture affiché : 380/2026-FAC, 381/2026-FAC… */
export const NUMERO_FACTURE_START = 380;

function yearFromDate(dateISO?: string): string {
  const y = (dateISO || "").slice(0, 4);
  if (/^\d{4}$/.test(y)) return y;
  return String(new Date().getFullYear());
}

function formatNumeroFacture(n: number, dateISO?: string): string {
  return `${n}/${yearFromDate(dateISO)}-FAC`;
}

/** Normalise un n° facture vers le format 380/2026-FAC. */
export function normalizeNumeroFacture(
  raw: string,
  dateISO?: string
): string {
  const s = (raw || "").trim();
  const m =
    /^(\d+)\/(\d{4})-FAC(?:TURE)?$/i.exec(s) ||
    /^(\d+)\/(\d{4})-Fact$/i.exec(s) ||
    /^(\d+)-FAC(?:TURE)?$/i.exec(s) ||
    /^(\d+)-Fact$/i.exec(s) ||
    /^FC-\d{2}\/(\d+)$/i.exec(s);
  if (m) {
    const n = Number(m[1]);
    const year = m[2] && /^\d{4}$/.test(m[2]) ? m[2] : yearFromDate(dateISO);
    return `${n}/${year}-FAC`;
  }
  return s;
}

function parseFactureNumero(raw: string): number | null {
  const s = (raw || "").trim();
  const m =
    /^(\d+)\/\d{4}-FAC(?:TURE)?$/i.exec(s) ||
    /^(\d+)\/\d{4}-Fact$/i.exec(s) ||
    /^(\d+)-FAC(?:TURE)?$/i.exec(s) ||
    /^(\d+)-Fact$/i.exec(s) ||
    /^FC-\d{2}\/(\d+)$/i.exec(s);
  return m ? Number(m[1]) : null;
}

/**
 * Si toutes les factures ont un n° < 380 (anciennes données de test),
 * les renumérote à partir de 380/AAAA-FAC. Sinon, normalise seulement.
 */
export function migrateFactureNumeros(list: FactureVente[]): FactureVente[] {
  if (list.length === 0) return list;

  const parsed = list.map((f) => ({
    f,
    n: parseFactureNumero(f.numeroFacture || ""),
  }));
  const hasFromStart = parsed.some(
    (x) => x.n != null && x.n >= NUMERO_FACTURE_START
  );

  if (hasFromStart) {
    return list.map((f) => ({
      ...f,
      numeroFacture: normalizeNumeroFacture(f.numeroFacture || "", f.date),
    }));
  }

  const ordered = [...parsed].sort((a, b) => {
    const da = a.f.date.localeCompare(b.f.date);
    if (da !== 0) return da;
    return a.f.id.localeCompare(b.f.id);
  });
  const byId = new Map<string, string>();
  ordered.forEach((x, i) => {
    byId.set(
      x.f.id,
      formatNumeroFacture(NUMERO_FACTURE_START + i, x.f.date)
    );
  });

  return list.map((f) => ({
    ...f,
    numeroFacture:
      byId.get(f.id) || normalizeNumeroFacture(f.numeroFacture || "", f.date),
  }));
}

export function nextNumeroFacture(
  existing: FactureVente[],
  dateISO?: string
): string {
  let max = NUMERO_FACTURE_START - 1;
  for (const f of existing) {
    const n = parseFactureNumero(f.numeroFacture || "");
    if (n != null) max = Math.max(max, n);
  }
  return formatNumeroFacture(
    Math.max(max + 1, NUMERO_FACTURE_START),
    dateISO
  );
}

export function factureForDevis(
  devisId: string,
  existing: FactureVente[]
): FactureVente | undefined {
  return existing.find((f) => f.devisId === devisId);
}

export function isDevisConverted(
  devisId: string,
  existing: FactureVente[]
): boolean {
  return !!factureForDevis(devisId, existing);
}

/** Clé de tri : année puis n° (448/2026-FAC → 2026, 448). */
function numeroSortKey(f: FactureVente): [number, number] {
  const m = /^(\d+)\/(\d{4})-/.exec((f.numeroFacture || "").trim());
  if (m) return [Number(m[2]), Number(m[1])];
  return [Number((f.date || "").slice(0, 4)) || 0, parseFactureNumero(f.numeroFacture) ?? 0];
}

/** Ordre numérique décroissant des n° facture (le plus récent en haut). */
export function compareFacturesParNumero(
  a: FactureVente,
  b: FactureVente
): number {
  const [ya, na] = numeroSortKey(a);
  const [yb, nb] = numeroSortKey(b);
  if (ya !== yb) return yb - ya;
  if (na !== nb) return nb - na;
  return b.id.localeCompare(a.id);
}

/** Date de facturation d'un document converti : aujourd'hui, échéance jamais antérieure. */
function conversionDates(echeanceSource: string) {
  const date = todayISO();
  return {
    date,
    mois: moisFromDate(date),
    echeance: echeanceSource && echeanceSource > date ? echeanceSource : date,
  };
}

/** Crée une facture vente à partir d'un devis. */
export function factureFromDevis(
  devis: Devis,
  existing: FactureVente[]
): FactureVente {
  const dates = conversionDates(devis.echeance);
  const numeroFacture = nextNumeroFacture(existing, dates.date);
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
    mois: dates.mois,
    date: dates.date,
    typeFacture: devis.typeFacture,
    base: "Vente",
    numeroFacture,
    bonCmdNumero: "BC-",
    clientId: devis.clientId,
    nomClient: devis.nomClient,
    ice: devis.ice ?? "",
    typeReglement: devis.typeReglement,
    echeance: dates.echeance,
    lignes: lignes.length ? lignes : [emptyLigne()],
    montantFacture: devis.montantFacture,
    devisId: devis.id,
  };
}

export function factureForBl(
  blId: string,
  existing: FactureVente[]
): FactureVente | undefined {
  return existing.find((f) => f.blIds?.includes(blId));
}

export function isBlConverted(
  blId: string,
  existing: FactureVente[]
): boolean {
  return !!factureForBl(blId, existing);
}

/** Crée une facture vente à partir d'un ou plusieurs BL du même client. */
export function factureFromBons(
  bons: BonLivraison[],
  existing: FactureVente[]
): FactureVente {
  const ordered = [...bons].sort((a, b) => a.date.localeCompare(b.date));
  const last = ordered[ordered.length - 1];
  const lignes: LigneFactureVente[] = ordered.flatMap((b) =>
    (b.lignes ?? []).map((l) => ({
      ref: l.ref ?? "",
      designation: l.designation,
      qte: Number(l.qte) || 0,
      unite: l.unite,
      prixU: Number(l.prixU) || 0,
      remise: Number(l.remise) || 0,
      tva: Number(l.tva) || 0,
      sousTotal: Number(l.sousTotal) || 0,
      blId: b.id,
    }))
  );

  const dates = conversionDates(last.echeance);

  return {
    id: nextFactureVenteId(existing),
    mois: dates.mois,
    date: dates.date,
    typeFacture: last.typeFacture,
    base: "Vente",
    numeroFacture: nextNumeroFacture(existing, dates.date),
    bonCmdNumero: "BC-",
    clientId: last.clientId,
    nomClient: last.nomClient,
    ice: last.ice ?? "",
    typeReglement: last.typeReglement,
    echeance: dates.echeance,
    lignes: lignes.length ? lignes : [emptyLigne()],
    montantFacture: totalFacture(lignes),
    blIds: ordered.map((b) => b.id),
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
    const parsed = readJsonStore<FactureVente[]>(STORAGE_KEY, []);
    if (!Array.isArray(parsed)) return [];
    const normalized = parsed.map((f) => ({
      ...f,
      bonCmdNumero: normalizeBonCmdNumero(f.bonCmdNumero ?? ""),
      typeReglement: normalizeTypeReglement(f.typeReglement),
      lignes:
        Array.isArray(f.lignes) && f.lignes.length > 0
          ? f.lignes
          : [emptyLigne()],
      montantFacture: Number(f.montantFacture) || 0,
    }));
    const migrated = migrateFactureNumeros(normalized);
    const changed = migrated.some(
      (f, i) =>
        f.numeroFacture !== normalized[i]?.numeroFacture ||
        f.bonCmdNumero !== normalized[i]?.bonCmdNumero ||
        f.typeReglement !== normalized[i]?.typeReglement
    );
    if (changed) writeJsonStore(STORAGE_KEY, migrated);
    return migrated;
  } catch {
    return [];
  }
}

export function saveFacturesVente(list: FactureVente[]): void {
  writeJsonStore(STORAGE_KEY, list);
}

/** Force le préfixe BC- sur le n° de bon de commande. */
export function normalizeBonCmdNumero(raw: string): string {
  let s = (raw || "").trim();
  if (!s) return "";
  s = s.replace(/^BC-?/i, "").trim();
  return s ? `BC-${s}` : "BC-";
}

/**
 * Qté sortie d'un produit (réf) : BL + factures de vente. Avoir = négatif.
 * Les lignes de facture issues d'un BL sont ignorées (déjà comptées au BL).
 */
export function qteVendueProduit(produitRef: string): number {
  const ref = produitRef.trim().toLowerCase();
  if (!ref) return 0;
  let total = qteLivreeProduit(produitRef);
  for (const f of loadFacturesVente()) {
    const sign = f.base === "Avoir" ? -1 : 1;
    for (const l of f.lignes ?? []) {
      if (l.blId) continue;
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
