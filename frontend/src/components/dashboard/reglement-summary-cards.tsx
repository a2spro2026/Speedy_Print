"use client";

import type { LucideIcon } from "lucide-react";
import { formatMoney } from "@/lib/money";

type ReglementLike = {
  factureId: string;
  montantFacture: number;
  montantPaye: number;
};

export function summarizeReglements(list: ReglementLike[]) {
  const byFacture = new Map<string, number>();
  let paye = 0;
  for (const r of list) {
    byFacture.set(r.factureId, Number(r.montantFacture) || 0);
    paye += Number(r.montantPaye) || 0;
  }
  let total = 0;
  for (const m of byFacture.values()) total += m;
  const solde = Math.round((total - paye) * 100) / 100;
  return {
    total: Math.round(total * 100) / 100,
    paye: Math.round(paye * 100) / 100,
    solde,
  };
}

type CardProps = {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  gradient: string;
};

export function ReglementStatCard({
  label,
  value,
  hint,
  icon: Icon,
  gradient,
}: CardProps) {
  return (
    <div
      className={`stat-card-fixed relative min-w-[180px] flex-1 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-4 py-3.5 text-white shadow-md`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            {label}
          </p>
          <p className="mt-1 text-xl font-extrabold tabular-nums tracking-tight">
            {formatMoney(value)}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-white/75">{hint}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
