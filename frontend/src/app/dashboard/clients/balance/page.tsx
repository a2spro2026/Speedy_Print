"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  buildBalanceClient,
  type LigneBalanceClient,
} from "@/lib/balance-client";
import { formatDateFR } from "@/lib/clients";
import { formatMoney, moneyTone } from "@/lib/money";

function printBalanceRows(rows: LigneBalanceClient[], title: string) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=800");
  if (!win) {
    toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }

  const body = rows
    .map(
      (r) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${formatDateFR(r.date)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${r.id}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${r.nomClient}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(r.totalFactures)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${formatMoney(r.totalPaye)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:700">${formatMoney(r.totalSolde)}</td>
        </tr>`
    )
    .join("");

  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>${title}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;padding:32px;max-width:960px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  p{color:#666;margin:0 0 24px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f8fafc;padding:8px;border-bottom:2px solid #e5e7eb}
  @media print{body{padding:0}}
</style></head><body>
  <h1>SpeedyPrint — ${title}</h1>
  <p>Factures vente uniquement (hors devis)</p>
  <table>
    <thead><tr>
      <th>Date</th><th>ID</th><th>Nom Client</th><th>Total Factures</th><th>Total Payé</th><th>Total Solde</th>
    </tr></thead>
    <tbody>${body}</tbody>
  </table>
  <script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}

export default function BalanceClientPage() {
  const router = useRouter();
  const [rows, setRows] = useState<LigneBalanceClient[]>([]);
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function refresh() {
    setRows(buildBalanceClient());
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
        acc.factures += r.totalFactures;
        acc.paye += r.totalPaye;
        acc.solde += r.totalSolde;
        return acc;
      },
      { factures: 0, paye: 0, solde: 0 }
    );
  }, [rows]);

  function onImprimer() {
    if (rows.length === 0) {
      toast.error("Aucune ligne à imprimer.");
      return;
    }
    const selected = selectedId
      ? rows.filter((r) => r.id === selectedId)
      : rows;
    printBalanceRows(
      selected,
      selected.length === 1
        ? `Balance Client — ${selected[0].nomClient}`
        : "Balance Client"
    );
  }

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
        Total Factures = factures vente uniquement (hors devis)
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onImprimer}>
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard")}
        >
          <X className="h-4 w-4" />
          Fermer
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Date</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">ID</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Nom Client</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Total Factures</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Total Payé</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Total Solde</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-sm text-muted"
                  >
                    Aucun client. Créez des fiches dans{" "}
                    <span className="font-semibold text-ink">Fiche Client</span>.
                  </td>
                </tr>
              ) : (
                rows.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={`cursor-pointer border-t border-slate-100 hover:bg-blue-50/50 ${
                      selectedId === r.id ? "bg-blue-50/80" : i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {formatDateFR(r.date)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                        {r.id}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">
                      {r.nomClient}
                    </td>
                    <td className={`px-3 py-3 tabular-nums ${moneyTone.facture}`}>
                      {formatMoney(r.totalFactures)}
                    </td>
                    <td className={`px-3 py-3 tabular-nums ${moneyTone.paye}`}>
                      {formatMoney(r.totalPaye)}
                    </td>
                    <td className={`px-3 py-3 font-bold tabular-nums ${moneyTone.solde}`}>
                      {formatMoney(r.totalSolde)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-300 bg-slate-100/90 font-bold">
                  <td className="px-3 py-3" colSpan={3}>
                    Totaux
                  </td>
                  <td className={`px-3 py-3 tabular-nums ${moneyTone.facture}`}>
                    {formatMoney(totals.factures)}
                  </td>
                  <td className={`px-3 py-3 tabular-nums ${moneyTone.paye}`}>
                    {formatMoney(totals.paye)}
                  </td>
                  <td className={`px-3 py-3 tabular-nums ${moneyTone.solde}`}>
                    {formatMoney(totals.solde)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
