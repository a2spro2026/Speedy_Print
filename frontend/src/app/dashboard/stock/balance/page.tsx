"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SEUIL_STOCK_FAIBLE,
  buildBalanceStock,
  type EtatStock,
  type LigneBalanceStock,
} from "@/lib/balance-stock";

function etatClass(etat: EtatStock): string {
  if (etat === "Dispo") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (etat === "Faible") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
}

function statutClass(statut: LigneBalanceStock["statut"]): string {
  return statut === "Actif"
    ? "bg-sky-50 text-sky-700 ring-1 ring-sky-200"
    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200";
}

export default function BalanceStockPage() {
  const [rows, setRows] = useState<LigneBalanceStock[]>([]);
  const [ready, setReady] = useState(false);

  function refresh() {
    setRows(buildBalanceStock());
    setReady(true);
  }

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onFocus);
    };
  }, []);

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.initial += r.stockInitial;
        acc.achat += r.achat;
        acc.vente += r.vente;
        acc.final += r.stockFinal;
        return acc;
      },
      { initial: 0, achat: 0, vente: 0, final: 0 }
    );
  }, [rows]);

  if (!ready) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2">
      <p className="text-center text-xs text-muted">
        Stock Final = Stock Initial + Achat − Vente · Faible ≤ {SEUIL_STOCK_FAIBLE}
      </p>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Réf</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Désignation</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Stock Initial</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Achat</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Vente</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Stock Final</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Statut</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Etat</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm text-muted"
                  >
                    Aucun produit. Créez des fiches dans{" "}
                    <span className="font-semibold text-ink">Fiche Produit</span>.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.ref}
                    className={`border-t border-slate-100 hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                        {r.ref}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">
                      {r.designation}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {r.stockInitial}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {r.achat}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {r.vente}
                    </td>
                    <td className="px-3 py-3 font-bold tabular-nums text-slate-900">
                      {r.stockFinal}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold ${statutClass(r.statut)}`}
                      >
                        {r.statut}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold ${etatClass(r.etat)}`}
                      >
                        {r.etat}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-bold">
                  <td className="px-3 py-3" colSpan={2}>
                    Totaux
                  </td>
                  <td className="px-3 py-3 tabular-nums">{totals.initial}</td>
                  <td className="px-3 py-3 tabular-nums">{totals.achat}</td>
                  <td className="px-3 py-3 tabular-nums">{totals.vente}</td>
                  <td className="px-3 py-3 tabular-nums text-brand">
                    {totals.final}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
