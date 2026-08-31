import { loadClients } from "@/lib/clients";
import { loadFacturesVente } from "@/lib/factures-vente";
import { loadReglementsClient } from "@/lib/reglements-client";

export type LigneBalanceClient = {
  date: string;
  id: string;
  nomClient: string;
  totalFactures: number;
  totalPaye: number;
  totalSolde: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Somme des factures vente uniquement (hors devis). */
export function sumFacturesVenteClient(clientId: string): number {
  return loadFacturesVente()
    .filter((fv) => fv.clientId === clientId)
    .reduce((s, fv) => {
      const sign = fv.base === "Avoir" ? -1 : 1;
      return s + sign * (Number(fv.montantFacture) || 0);
    }, 0);
}

export function buildBalanceClient(): LigneBalanceClient[] {
  const reglements = loadReglementsClient();

  return loadClients()
    .map((c) => {
      const montantFactures = sumFacturesVenteClient(c.id);
      // Colonne Total Factures = factures vente seulement (pas devis).
      const totalFactures = round2(montantFactures);
      const totalPaye = round2(
        reglements
          .filter((r) => r.clientId === c.id)
          .reduce((s, r) => s + (Number(r.montantPaye) || 0), 0)
      );
      // Solde = solde fiche (ouverture + factures sync) − règlements.
      const totalSolde = round2((Number(c.soldeInitial) || 0) - totalPaye);

      return {
        date: c.date,
        id: c.id,
        nomClient: c.nom,
        totalFactures,
        totalPaye,
        totalSolde,
      } satisfies LigneBalanceClient;
    })
    .sort((a, b) => a.nomClient.localeCompare(b.nomClient, "fr"));
}
