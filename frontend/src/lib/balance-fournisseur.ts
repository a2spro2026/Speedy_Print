import { loadFournisseurs } from "@/lib/fournisseurs";
import { loadFacturesAchat } from "@/lib/factures-achat";
import { loadReglements } from "@/lib/reglements-fournisseur";

export type LigneBalanceFournisseur = {
  date: string;
  id: string;
  nomFournisseur: string;
  totalFactures: number;
  totalPaye: number;
  totalSolde: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildBalanceFournisseur(): LigneBalanceFournisseur[] {
  const factures = loadFacturesAchat();
  const reglements = loadReglements();

  return loadFournisseurs()
    .map((f) => {
      const montantFactures = factures
        .filter((fa) => fa.fournisseurId === f.id)
        .reduce((s, fa) => {
          const sign = fa.base === "Avoir" ? -1 : 1;
          return s + sign * (Number(fa.montantFacture) || 0);
        }, 0);

      const totalFactures = round2(
        (Number(f.soldeInitial) || 0) + montantFactures
      );
      const totalPaye = round2(
        reglements
          .filter((r) => r.fournisseurId === f.id)
          .reduce((s, r) => s + (Number(r.montantPaye) || 0), 0)
      );
      const totalSolde = round2(totalFactures - totalPaye);

      return {
        date: f.date,
        id: f.id,
        nomFournisseur: f.nom,
        totalFactures,
        totalPaye,
        totalSolde,
      } satisfies LigneBalanceFournisseur;
    })
    .sort((a, b) => a.nomFournisseur.localeCompare(b.nomFournisseur, "fr"));
}
