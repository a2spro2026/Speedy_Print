"use client";

import Image from "next/image";
import { Menu, X } from "lucide-react";

type AppNavbarProps = {
  title: string;
  subtitle?: string;
  /** Bouton menu mobile (ouvre la liste latérale). */
  onMenuClick?: () => void;
  menuOpen?: boolean;
};

export function AppNavbar({
  title,
  subtitle,
  onMenuClick,
  menuOpen = false,
}: AppNavbarProps) {
  const isBrandHome = title === "SpeedyPrint";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[60px] items-center justify-between gap-3 px-3 md:gap-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          {onMenuClick ? (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menuOpen}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50 md:hidden"
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          ) : null}

          <div className="min-w-0">
            {isBrandHome ? (
              <>
                <h1 className="truncate bg-gradient-to-r from-[#1e3a8a] via-[#2563EB] to-[#DC2626] bg-clip-text text-xl font-extrabold tracking-[-0.03em] text-transparent sm:text-2xl md:text-[1.7rem]">
                  Speedy<span className="italic font-bold">Print</span>
                </h1>
                <p className="mt-0.5 truncate text-[12px] font-medium italic tracking-wide text-slate-500 sm:text-[13px]">
                  La Solution qui{" "}
                  <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text font-semibold not-italic text-transparent">
                    Gère
                  </span>
                </p>
              </>
            ) : (
              <>
                <h1 className="truncate text-base font-extrabold tracking-tight text-slate-800 sm:text-lg md:text-xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="truncate text-[12px] font-medium text-slate-500 sm:text-[13px]">
                    {subtitle}
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white to-slate-50 py-1 pl-1 pr-2 shadow-sm sm:gap-2.5 sm:pr-2.5">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl ring-2 ring-[#2563EB]/25 sm:h-9 sm:w-9">
            <Image
              src="/avatars/khalid.jpg"
              alt="Photo de profil — MR KAHLID"
              fill
              className="object-cover"
              sizes="44px"
              priority
            />
          </div>
          <div className="hidden min-w-0 leading-tight sm:block">
            <div className="text-xs font-extrabold tracking-wide text-slate-800 sm:text-sm">
              MR KAHLID
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#2563EB] sm:text-[11px]">
              Administrateur
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
