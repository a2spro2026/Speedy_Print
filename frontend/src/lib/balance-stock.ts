import { qteAcheteeProduit } from "@/lib/factures-achat";
import { qteVendueProduit } from "@/lib/factures-vente";
import { loadProduits, type Produit } from "@/lib/produits";

export type EtatStock = "Dispo" | "Faible" | "Rupture";
export type StatutProduit = "Actif" | "Inactif";

/** Seuil sous lequel le stock est considéré faible (mais > 0). */
export const SEUIL_STOCK_FAIBLE = 5;

export type LigneBalanceStock = {
  ref: string;
  designation: string;
  stockInitial: number;
  achat: number;
  vente: number;
  stockFinal: number;
  statut: StatutProduit;
  etat: EtatStock;
};

export function stockFinalBalance(
  stockInitial: number,
  produitRef: string
): number {
  return (
    (Number(stockInitial) || 0) +
    qteAcheteeProduit(produitRef) -
    qteVendueProduit(produitRef)
  );
}

export function etatStock(stockFinal: number): EtatStock {
  if (stockFinal <= 0) return "Rupture";
  if (stockFinal <= SEUIL_STOCK_FAIBLE) return "Faible";
  return "Dispo";
}

export function buildBalanceStock(): LigneBalanceStock[] {
  return loadProduits()
    .map((p: Produit) => {
      const achat = qteAcheteeProduit(p.ref);
      const vente = qteVendueProduit(p.ref);
      const stockFinal =
        (Number(p.qteInitiale) || 0) + achat - vente;
      return {
        ref: p.ref,
        designation: p.designation,
        stockInitial: Number(p.qteInitiale) || 0,
        achat,
        vente,
        stockFinal,
        statut: p.actif === false ? "Inactif" : "Actif",
        etat: etatStock(stockFinal),
      };
    })
    .sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true }));
}
