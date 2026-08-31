"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Printer, X } from "lucide-react";
import { toast } from "sonner";
import {
  buildBalanceClient,
  type LigneBalanceClient,
} from "@/lib/balance-client";
import { formatDateFR } from "@/lib/clients";
import { formatMoney, moneyTone } from "@/lib/money";

function printBalance(row: LigneBalanceClient) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=700");
  if (!win) {
    toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }

  const lines = [
    ["Date", formatDateFR(row.date)],
    ["ID", row.id],
    ["Nom Client", row.nomClient],
    ["Total Factures", formatMoney(row.totalFactures)],
    ["Total Payé", formatMoney(row.totalPaye)],
    ["Total Solde", formatMoney(row.totalSolde)],
  ]
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;width:40%">${k}</th><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${v}</td></tr>`
    )
    .join("");

  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Balance ${row.id}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  p{color:#666;margin:0 0 24px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  @media print{body{padding:0}}
</style></head><body>
  <h1>SpeedyPrint — Balance Client</h1>
  <p>${row.nomClient} · ${row.id}</p>
  <table>${lines}</table>
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

  function onFermer(row: LigneBalanceClient) {
    if (selectedId === row.id) {
      setSelectedId(null);
      return;
    }
    router.push("/dashboard");
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Date</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">ID</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Nom Client</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Total Factures</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Total Payé</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Total Solde</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Imprimer</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Fermer</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
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
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center">
                        <ActionBtn
                          label="Imprimer"
                          onClick={(e) => {
                            e.stopPropagation();
                            printBalance(r);
                          }}
                          className="text-slate-700 hover:bg-slate-100"
                        >
                          <Printer className="h-4 w-4" />
                        </ActionBtn>
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center">
                        <ActionBtn
                          label="Fermer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFermer(r);
                          }}
                          className="text-rose-700 hover:bg-rose-50"
                        >
                          <X className="h-4 w-4" />
                        </ActionBtn>
                      </div>
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

function ActionBtn({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
