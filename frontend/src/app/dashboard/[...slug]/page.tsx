"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard/clients/fiches": "Fiche Client",
  "/dashboard/clients/devis": "Devis",
  "/dashboard/clients/factures": "Facture Vente",
  "/dashboard/clients/reglements": "Règlement Client",
  "/dashboard/clients/balance": "Balance Client",
  "/dashboard/fournisseurs/fiches": "Fiche Fournisseur",
  "/dashboard/fournisseurs/factures": "Facture Achat",
  "/dashboard/fournisseurs/reglements": "Règlement Fournisseur",
  "/dashboard/fournisseurs/balance": "Balance Fournisseur",
  "/dashboard/stock/produits": "Fiche Produit",
  "/dashboard/stock/balance": "Balance Stock",
  "/dashboard/stock/mouvements": "Mouvement Stock",
  "/dashboard/charges": "Charge",
  "/dashboard/charges/balance": "Balance Charge",
  "/dashboard/tresorerie/caisse": "Caisse",
  "/dashboard/tresorerie/banque": "Banque",
  "/dashboard/configuration/utilisateurs": "Utilisateur",
};

export default function ModulePlaceholderPage() {
  const pathname = usePathname();
  const title = titles[pathname] ?? "Module";

  return (
    <div className="p-4 md:p-8">
      <div className="rounded-2xl border border-dashed border-brand/30 bg-white p-8 shadow-sm">
        <h2 className="text-base font-bold text-ink">{title}</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Cette section est prête dans le menu. L&apos;écran de gestion sera
          branché ensuite sur vos données métier.
        </p>
      </div>
    </div>
  );
}
