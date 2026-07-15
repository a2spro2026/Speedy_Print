"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  Banknote,
  Building2,
  ChevronDown,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Scale,
  Settings,
  Truck,
  UserCog,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { SpeedyLogo } from "@/components/brand/speedy-logo";
import { cn } from "@/lib/utils";

type NavChild = {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
};

type NavGroup = {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
  children: NavChild[];
};

const groups: NavGroup[] = [
  {
    id: "fournisseurs",
    label: "Fournisseur",
    icon: Truck,
    accent: "from-violet-500 to-purple-600",
    children: [
      { label: "Fiche Fournisseur", href: "/dashboard/fournisseurs/fiches", icon: Building2 },
      { label: "Facture Achat", href: "/dashboard/fournisseurs/factures", icon: Receipt },
      { label: "Règlement", href: "/dashboard/fournisseurs/reglements", icon: Wallet },
      { label: "Balance", href: "/dashboard/fournisseurs/balance", icon: Scale },
    ],
  },
  {
    id: "clients",
    label: "Client",
    icon: Users,
    accent: "from-sky-500 to-blue-600",
    children: [
      { label: "Fiche Client", href: "/dashboard/clients/fiches", icon: Users },
      { label: "Devis", href: "/dashboard/clients/devis", icon: ClipboardList },
      { label: "Facture Vente", href: "/dashboard/clients/factures", icon: FileText },
      { label: "Règlement", href: "/dashboard/clients/reglements", icon: Wallet },
      { label: "Balance", href: "/dashboard/clients/balance", icon: Scale },
    ],
  },
  {
    id: "stock",
    label: "Gestion Stock",
    icon: Warehouse,
    accent: "from-amber-500 to-orange-600",
    children: [
      { label: "Fiche Produit", href: "/dashboard/stock/produits", icon: Package },
      { label: "Balance Stock", href: "/dashboard/stock/balance", icon: Scale },
      { label: "Mouvement Stock", href: "/dashboard/stock/mouvements", icon: ArrowLeftRight },
    ],
  },
  {
    id: "charges",
    label: "Charge",
    icon: Receipt,
    accent: "from-rose-500 to-pink-600",
    children: [
      { label: "Charge", href: "/dashboard/charges", icon: Receipt },
      { label: "Balance Charge", href: "/dashboard/charges/balance", icon: Scale },
    ],
  },
  {
    id: "tresorerie",
    label: "Trésorerie",
    icon: Banknote,
    accent: "from-emerald-500 to-teal-600",
    children: [
      { label: "Caisse", href: "/dashboard/tresorerie/caisse", icon: Wallet },
      { label: "Banque", href: "/dashboard/tresorerie/banque", icon: Building2 },
    ],
  },
  {
    id: "config",
    label: "Configuration",
    icon: Settings,
    accent: "from-slate-500 to-slate-700",
    children: [
      { label: "Utilisateur", href: "/dashboard/configuration/utilisateurs", icon: UserCog },
    ],
  },
];

type AppSidebarProps = {
  onLogout: () => void;
};

export function AppSidebar({ onLogout }: AppSidebarProps) {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  useEffect(() => {
    const active = groups.find((group) =>
      group.children.some((child) => pathname.startsWith(child.href))
    );
    if (active) {
      setOpenGroups((prev) =>
        prev.includes(active.id) ? prev : [...prev, active.id]
      );
    }
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isDashboard = pathname === "/dashboard";

  return (
    <aside className="relative flex h-dvh w-[280px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-[#0b1220] text-white shadow-[8px_0_40px_rgba(15,23,42,0.25)]">
      <div className="pointer-events-none absolute -left-16 top-24 h-40 w-40 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-28 h-44 w-44 rounded-full bg-violet/25 blur-3xl" />

      <div className="relative z-10 border-b border-white/10 px-4 py-4">
        <SpeedyLogo frame="card" variant="full" className="max-h-14 sm:max-h-16" />
      </div>

      <nav className="relative z-10 flex-1 space-y-2 overflow-y-auto px-3 py-4 scrollbar-thin">
        {/* Tableau de bord — bouton hero */}
        <Link
          href="/dashboard"
          className={cn(
            "group relative mb-3 flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300",
            isDashboard
              ? "bg-gradient-to-r from-brand via-[#3b82f6] to-violet text-white shadow-[0_12px_30px_rgba(37,99,235,0.45)] ring-1 ring-white/20"
              : "bg-white/5 text-white/85 ring-1 ring-white/10 hover:bg-white/10 hover:text-white hover:shadow-[0_10px_24px_rgba(37,99,235,0.25)]"
          )}
        >
          <span
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl transition",
              isDashboard
                ? "bg-white/20 text-white"
                : "bg-gradient-to-br from-brand to-violet text-white shadow-md"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span className="flex-1 leading-tight">
            Tableau de bord
            <span className="mt-0.5 block text-[11px] font-medium opacity-75">
              Vue d&apos;ensemble
            </span>
          </span>
          {isDashboard && (
            <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
          )}
        </Link>

        <div className="px-1 pb-1 pt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">
          Modules
        </div>

        {groups.map((group) => {
          const open = openGroups.includes(group.id);
          const childActive = group.children.some((child) =>
            pathname.startsWith(child.href)
          );

          return (
            <div
              key={group.id}
              className={cn(
                "rounded-2xl transition",
                open || childActive ? "bg-white/[0.04] ring-1 ring-white/10" : ""
              )}
            >
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition",
                  childActive || open
                    ? "text-white"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                )}
                aria-expanded={open}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
                    group.accent
                  )}
                >
                  <group.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{group.label}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-white/50 transition-transform duration-300",
                    open && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-1 px-2 pb-2 pt-1">
                      {group.children.map((child) => {
                        const active = pathname.startsWith(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition",
                              active
                                ? "bg-white text-slate-900 shadow-md shadow-black/20"
                                : "text-white/65 hover:bg-white/8 hover:text-white"
                            )}
                          >
                            <child.icon
                              className={cn(
                                "h-3.5 w-3.5",
                                active ? "text-brand" : "opacity-70"
                              )}
                            />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      <div className="relative z-10 border-t border-white/10 p-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/85 transition hover:border-rose-400/30 hover:bg-rose-500/20 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
