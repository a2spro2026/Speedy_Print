"use client";

import Image from "next/image";

type AppNavbarProps = {
  title: string;
  subtitle?: string;
};

export function AppNavbar({ title, subtitle }: AppNavbarProps) {
  const isBrandHome = title === "SpeedyPrint";

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/95 backdrop-blur-xl">
      <div className="flex h-[60px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="min-w-0">
          {isBrandHome ? (
            <>
              <h1 className="truncate bg-gradient-to-r from-[#1e3a8a] via-[#2563EB] to-[#DC2626] bg-clip-text text-2xl font-extrabold tracking-[-0.03em] text-transparent md:text-[1.7rem]">
                Speedy<span className="italic font-bold">Print</span>
              </h1>
              <p className="mt-0.5 truncate text-[13px] font-medium italic tracking-wide text-slate-500">
                La Solution qui{" "}
                <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text font-semibold not-italic text-transparent">
                  Gère
                </span>
              </p>
            </>
          ) : (
            <>
              <h1 className="truncate text-lg font-extrabold tracking-tight text-slate-800 md:text-xl">
                {title}
              </h1>
              {subtitle && (
                <p className="truncate text-[13px] font-medium text-slate-500">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2.5 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-white to-slate-50 py-1 pl-1 pr-2.5 shadow-sm">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl ring-2 ring-[#2563EB]/25">
            <Image
              src="/avatars/khalid.jpg"
              alt="Photo de profil — MR KAHLID"
              fill
              className="object-cover"
              sizes="44px"
              priority
            />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="text-sm font-extrabold tracking-wide text-slate-800">
              MR KAHLID
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
              Administrateur
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
