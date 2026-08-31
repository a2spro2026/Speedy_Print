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

export function buildBalanceClient(): LigneBalanceClient[] {
  const factures = loadFacturesVente();
  const reglements = loadReglementsClient();

  return loadClients()
    .map((c) => {
      const montantFactures = factures
        .filter((fv) => fv.clientId === c.id)
        .reduce((s, fv) => {
          const sign = fv.base === "Avoir" ? -1 : 1;
          return s + sign * (Number(fv.montantFacture) || 0);
        }, 0);

      const totalFactures = round2(
        (Number(c.soldeInitial) || 0) + montantFactures
      );
      const totalPaye = round2(
        reglements
          .filter((r) => r.clientId === c.id)
          .reduce((s, r) => s + (Number(r.montantPaye) || 0), 0)
      );
      const totalSolde = round2(totalFactures - totalPaye);

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
