"use client";

import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppNavbar } from "@/components/layout/app-navbar";
import { signOut } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "SpeedyPrint",
    subtitle: "La Solution qui Gère",
  },
  "/dashboard/clients/fiches": { title: "Fiche Client", subtitle: "Module Client" },
  "/dashboard/clients/devis": { title: "Devis", subtitle: "Module Client" },
  "/dashboard/clients/factures": { title: "Facture Vente", subtitle: "Module Client" },
  "/dashboard/clients/reglements": { title: "Règlement", subtitle: "Module Client" },
  "/dashboard/clients/balance": { title: "Balance Client", subtitle: "Module Client" },
  "/dashboard/fournisseurs/fiches": { title: "Fiche Fournisseur", subtitle: "Module Fournisseur" },
  "/dashboard/fournisseurs/factures": { title: "Facture Achat", subtitle: "Module Fournisseur" },
  "/dashboard/fournisseurs/reglements": { title: "Règlement", subtitle: "Module Fournisseur" },
  "/dashboard/fournisseurs/balance": { title: "Balance Fournisseur", subtitle: "Module Fournisseur" },
  "/dashboard/stock/produits": { title: "Fiche Produit", subtitle: "Gestion Stock" },
  "/dashboard/stock/balance": { title: "Balance Stock", subtitle: "Gestion Stock" },
  "/dashboard/stock/mouvements": { title: "Mouvement Stock", subtitle: "Gestion Stock" },
  "/dashboard/charges": { title: "Charge", subtitle: "Module Charge" },
  "/dashboard/charges/balance": { title: "Balance Charge", subtitle: "Module Charge" },
  "/dashboard/tresorerie/caisse": { title: "Caisse", subtitle: "Trésorerie" },
  "/dashboard/tresorerie/banque": { title: "Banque", subtitle: "Trésorerie" },
  "/dashboard/configuration/utilisateurs": { title: "Utilisateur", subtitle: "Configuration" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, ready } = useRequireAuth();

  if (!ready || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface text-muted">
        Chargement de votre espace…
      </div>
    );
  }

  const logout = () => {
    signOut();
    router.replace("/");
  };

  const meta = titles[pathname] ?? {
    title: "SpeedyPrint",
    subtitle: "La Solution qui Gère",
  };

  return (
    <div className="flex min-h-dvh bg-surface">
      <div className="sticky top-0 hidden h-dvh md:block">
        <AppSidebar onLogout={logout} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Une seule barre supérieure pour tout le dashboard */}
        <AppNavbar title={meta.title} subtitle={meta.subtitle} />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
