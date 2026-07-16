export type Produit = {
  ref: string; // Pro0001
  designation: string;
  qteInitiale: number;
  achats: number;
  prixAchat: number; // P/A
  prixVente: number; // P/V
  actif: boolean;
};

const STORAGE_KEY = "speedyprint.produits";

function padRef(n: number): string {
  return `Pro${String(n).padStart(4, "0")}`;
}

export function nextProduitRef(existing: Produit[]): string {
  let max = 0;
  for (const p of existing) {
    const m = /^Pro(\d+)$/i.exec(p.ref);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padRef(max + 1);
}

export function loadProduits(): Produit[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Produit[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((p) => ({
      ref: p.ref,
      designation: p.designation ?? "",
      qteInitiale: Number(p.qteInitiale) || 0,
      achats: Number(p.achats ?? (p as { qteStock?: number }).qteStock) || 0,
      prixAchat: Number(p.prixAchat) || 0,
      prixVente: Number(p.prixVente) || 0,
      actif: p.actif !== false,
    }));
  } catch {
    return [];
  }
}

export function saveProduits(list: Produit[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
