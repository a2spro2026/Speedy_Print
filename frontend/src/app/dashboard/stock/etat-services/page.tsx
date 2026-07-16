"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/money";
import { loadServices, type Service } from "@/lib/services";

type Statut = "Actif" | "Inactif";

function statutOf(s: Service): Statut {
  return s.actif === false ? "Inactif" : "Actif";
}

function statutClass(statut: Statut): string {
  return statut === "Actif"
    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
    : "bg-slate-100 text-slate-500 ring-1 ring-slate-200";
}

export default function EtatServicePage() {
  const [list, setList] = useState<Service[]>([]);
  const [ready, setReady] = useState(false);

  function refresh() {
    const data = [...loadServices()].sort((a, b) =>
      a.ref.localeCompare(b.ref, undefined, { numeric: true })
    );
    setList(data);
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

  if (!ready) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Réf</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Désignation</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">U</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">P/V</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Statut</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-14 text-center text-sm text-muted"
                  >
                    Aucun service. Créez des fiches dans{" "}
                    <span className="font-semibold text-ink">Fiche Service</span>.
                  </td>
                </tr>
              ) : (
                list.map((s, i) => {
                  const statut = statutOf(s);
                  return (
                    <tr
                      key={s.ref}
                      className={`border-t border-slate-100 hover:bg-blue-50/50 ${
                        i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                          {s.ref}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-ink">
                        {s.designation}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{s.unite}</td>
                      <td className="px-3 py-3 font-bold tabular-nums text-slate-800">
                        {formatMoney(s.prixVente)}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold ${statutClass(statut)}`}
                        >
                          {statut}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
