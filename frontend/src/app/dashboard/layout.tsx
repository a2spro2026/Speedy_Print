"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppNavbar } from "@/components/layout/app-navbar";
import { signOut } from "@/lib/auth";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { wipeBusinessDataOnce } from "@/lib/wipe-business-data";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "SpeedyPrint",
    subtitle: "La Solution qui Gère",
  },
  "/dashboard/clients/fiches": {
    title: "Saisie Nouveau Client",
    subtitle: "",
  },
  "/dashboard/clients/devis": {
    title: "Saisie Nouveau Devis",
    subtitle: "",
  },
  "/dashboard/clients/factures": {
    title: "Saisie Nouvelle Facture",
    subtitle: "",
  },
  "/dashboard/clients/reglements": {
    title: "Saisie Nouveau Règlement",
    subtitle: "",
  },
  "/dashboard/clients/balance": { title: "Balance Client", subtitle: "" },
  "/dashboard/fournisseurs/fiches": {
    title: "Saisie Nouveau Fournisseur",
    subtitle: "",
  },
  "/dashboard/fournisseurs/factures": {
    title: "Saisie Nouvelle Facture",
    subtitle: "",
  },
  "/dashboard/fournisseurs/reglements": {
    title: "Saisie Nouveau Règlement",
    subtitle: "",
  },
  "/dashboard/fournisseurs/balance": { title: "Balance Fournisseur", subtitle: "" },
  "/dashboard/stock/produits": {
    title: "Saisie Nouveau Produit",
    subtitle: "",
  },
  "/dashboard/stock/services": {
    title: "Saisie Nouveau Service",
    subtitle: "",
  },
  "/dashboard/stock/balance": { title: "Balance Stock", subtitle: "Gestion Stock" },
  "/dashboard/stock/etat-services": { title: "Etat Service", subtitle: "Gestion Stock" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Une fois : vider les données de saisie locales (livraison client)
  useEffect(() => {
    wipeBusinessDataOnce();
  }, []);

  // Fermer le tiroir à chaque navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Bloquer le scroll du body quand le menu mobile est ouvert
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileMenuOpen]);

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
      {/* Desktop : sidebar fixe */}
      <div className="sticky top-0 hidden h-dvh md:block">
        <AppSidebar onLogout={logout} />
      </div>

      {/* Mobile : overlay + tiroir latéral */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex max-w-[85vw] shadow-2xl">
            <AppSidebar onLogout={logout} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar
          title={meta.title}
          subtitle={meta.subtitle}
          menuOpen={mobileMenuOpen}
          onMenuClick={() => setMobileMenuOpen((o) => !o)}
        />
        <div className="min-h-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
