import { normalizeTypeReglement, type TypeReglement } from "@/lib/clients";
import { readJsonStore, writeJsonStore } from "@/lib/business-store";
import {
  emptyLigne,
  type LigneDevis,
  type TypeFacture,
} from "@/lib/devis";

export type LigneBonLivraison = LigneDevis;

export type BonLivraison = {
  id: string; // BL-xxxx
  mois: string;
  date: string;
  typeFacture: TypeFacture;
  numeroBL: string; // 0001/2026-BL
  clientId: string;
  nomClient: string;
  ice: string;
  typeReglement: TypeReglement;
  echeance: string;
  lignes: LigneBonLivraison[];
  montantFacture: number;
};

const STORAGE_KEY = "speedyprint.bons-livraison";

function padId(n: number): string {
  return `BL-${String(n).padStart(4, "0")}`;
}

export function nextBonLivraisonId(existing: BonLivraison[]): string {
  let max = 0;
  for (const b of existing) {
    const m = /^BL-(\d+)$/.exec(b.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

function yearFromDate(dateISO?: string): string {
  const y = (dateISO || "").slice(0, 4);
  if (/^\d{4}$/.test(y)) return y;
  return String(new Date().getFullYear());
}

function parseNumeroBL(raw: string): { n: number; year?: string } | null {
  const s = (raw || "").trim();
  const m = /^(\d+)\/(\d{4})-BL$/i.exec(s) || /^(\d+)-BL$/i.exec(s);
  if (!m) return null;
  return { n: Number(m[1]), year: m[2] };
}

/** Normalise un n° BL vers le format 0001/2026-BL. */
export function normalizeNumeroBL(raw: string, dateISO?: string): string {
  const p = parseNumeroBL(raw);
  if (!p) return (raw || "").trim();
  return `${String(p.n).padStart(4, "0")}/${p.year ?? yearFromDate(dateISO)}-BL`;
}

/** Prochain n° BL de l'année : 0001/2026-BL, 0002/2026-BL… */
export function nextNumeroBL(
  existing: BonLivraison[],
  dateISO?: string
): string {
  const year = yearFromDate(dateISO);
  let max = 0;
  for (const b of existing) {
    const p = parseNumeroBL(b.numeroBL);
    if (p && (p.year ?? yearFromDate(b.date)) === year) {
      max = Math.max(max, p.n);
    }
  }
  return `${String(max + 1).padStart(4, "0")}/${year}-BL`;
}

export function loadBonsLivraison(): BonLivraison[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = readJsonStore<BonLivraison[]>(STORAGE_KEY, []);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((b) => ({
      ...b,
      numeroBL: normalizeNumeroBL(b.numeroBL || "", b.date),
      typeReglement: normalizeTypeReglement(b.typeReglement),
      lignes:
        Array.isArray(b.lignes) && b.lignes.length > 0
          ? b.lignes
          : [emptyLigne()],
      montantFacture: Number(b.montantFacture) || 0,
    }));
  } catch {
    return [];
  }
}

export function saveBonsLivraison(list: BonLivraison[]): void {
  writeJsonStore(STORAGE_KEY, list);
}

/** Qté livrée d'un produit (réf) — le stock sort au BL. */
export function qteLivreeProduit(produitRef: string): number {
  const ref = produitRef.trim().toLowerCase();
  if (!ref) return 0;
  let total = 0;
  for (const b of loadBonsLivraison()) {
    for (const l of b.lignes ?? []) {
      if ((l.ref || "").trim().toLowerCase() === ref) {
        total += Number(l.qte) || 0;
      }
    }
  }
  return total;
}
