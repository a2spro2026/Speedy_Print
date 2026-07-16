"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, toMoneyInput } from "@/lib/money";
import { stockFinalBalance } from "@/lib/balance-stock";
import { qteAcheteeProduit } from "@/lib/factures-achat";
import { qteVendueProduit } from "@/lib/factures-vente";
import {
  loadProduits,
  nextProduitRef,
  saveProduits,
  type Produit,
} from "@/lib/produits";

const schema = z.object({
  ref: z.string().min(1),
  designation: z.string().min(1, "Désignation obligatoire"),
  qteInitiale: z
    .string()
    .min(1, "Qte initiale obligatoire")
    .refine((v) => Number.isFinite(Number(v.replace(/\s/g, "").replace(",", "."))), {
      message: "Quantité invalide",
    }),
  prixAchat: z
    .string()
    .min(1, "P/A obligatoire")
    .refine((v) => Number.isFinite(Number(v.replace(/\s/g, "").replace(",", "."))), {
      message: "Montant invalide",
    }),
  prixVente: z
    .string()
    .min(1, "P/V obligatoire")
    .refine((v) => Number.isFinite(Number(v.replace(/\s/g, "").replace(",", "."))), {
      message: "Montant invalide",
    }),
  actif: z.enum(["Actif", "Inactif"]),
});

type FormValues = z.infer<typeof schema>;
type FormMode = "idle" | "create" | "edit" | "view";

const selectClass =
  "flex h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-sm font-medium text-ink transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const inputShell =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 text-center shadow-none transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-0";

const inputReadonly =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-3 text-center font-medium text-slate-700 shadow-none focus-visible:ring-0";

function parseNum(value: string): number {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function emptyForm(ref: string): FormValues {
  return {
    ref,
    designation: "",
    qteInitiale: "0",
    prixAchat: "0.00",
    prixVente: "0.00",
    actif: "Actif",
  };
}

function toFormValues(p: Produit): FormValues {
  return {
    ref: p.ref,
    designation: p.designation,
    qteInitiale: String(p.qteInitiale),
    prixAchat: toMoneyInput(p.prixAchat),
    prixVente: toMoneyInput(p.prixVente),
    actif: p.actif === false ? "Inactif" : "Actif",
  };
}

function printProduit(p: Produit) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!win) {
    toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }
  const achats = qteAcheteeProduit(p.ref);
  const ventes = qteVendueProduit(p.ref);
  const stockFinal = stockFinalBalance(p.qteInitiale, p.ref);
  const rows = [
    ["Réf", p.ref],
    ["Désignation", p.designation],
    ["Qte Initiale", String(p.qteInitiale)],
    ["Achats (factures)", String(achats)],
    ["Ventes (factures)", String(ventes)],
    ["Stock Final", String(stockFinal)],
    ["Statut", p.actif === false ? "Inactif" : "Actif"],
    ["P/A", formatMoney(p.prixAchat)],
    ["P/V", formatMoney(p.prixVente)],
  ]
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;width:40%">${k}</th><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${v}</td></tr>`
    )
    .join("");
  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Fiche Produit ${p.ref}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  p{color:#666;margin:0 0 24px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  @media print{body{padding:0}}
</style></head><body>
  <h1>SpeedyPrint — Fiche Produit</h1>
  <p>${p.designation} · ${p.ref}</p>
  <table>${rows}</table>
  <script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}

export default function FicheProduitPage() {
  const [list, setList] = useState<Produit[]>([]);
  const [mode, setMode] = useState<FormMode>("idle");
  const [ready, setReady] = useState(false);
  const [achatTick, setAchatTick] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm("Pro0001"),
  });

  const refWatch = watch("ref");
  const qteInitialeWatch = watch("qteInitiale");
  const achatsFacture = useMemo(
    () => qteAcheteeProduit(refWatch || ""),
    [refWatch, achatTick]
  );
  const ventesFacture = useMemo(
    () => qteVendueProduit(refWatch || ""),
    [refWatch, achatTick]
  );
  const stockFinal = useMemo(
    () => parseNum(qteInitialeWatch ?? "0") + achatsFacture - ventesFacture,
    [qteInitialeWatch, achatsFacture, ventesFacture]
  );

  useEffect(() => {
    const data = loadProduits();
    setList(data);
    reset(emptyForm(nextProduitRef(data)));
    setReady(true);
  }, [reset]);

  // Recharger les achats si on revient sur la page (focus)
  useEffect(() => {
    const refresh = () => setAchatTick((n) => n + 1);
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const sorted = useMemo(
    () => [...list].sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true })),
    [list]
  );

  const fieldsLocked = mode === "view" || mode === "idle";

  function openNouveau() {
    reset(emptyForm(nextProduitRef(list)));
    setAchatTick((n) => n + 1);
    setMode("create");
  }

  function openView(p: Produit) {
    reset(toFormValues(p));
    setAchatTick((n) => n + 1);
    setMode("view");
  }

  function openEdit(p: Produit) {
    reset(toFormValues(p));
    setAchatTick((n) => n + 1);
    setMode("edit");
  }

  function onAnnuler() {
    reset(emptyForm(nextProduitRef(list)));
    setMode("idle");
  }

  function onDelete(p: Produit) {
    const ok = window.confirm(`Supprimer le produit « ${p.designation} » (${p.ref}) ?`);
    if (!ok) return;
    const next = list.filter((x) => x.ref !== p.ref);
    setList(next);
    saveProduits(next);
    if (getValues("ref") === p.ref) {
      reset(emptyForm(nextProduitRef(next)));
      setMode("idle");
    }
    toast.success("Produit supprimé.");
  }

  function onSubmit(values: FormValues) {
    if (mode !== "create" && mode !== "edit") return;

    const row: Produit = {
      ref: values.ref.trim(),
      designation: values.designation.trim(),
      qteInitiale: parseNum(values.qteInitiale),
      achats: qteAcheteeProduit(values.ref.trim()),
      prixAchat: parseNum(values.prixAchat),
      prixVente: parseNum(values.prixVente),
      actif: values.actif === "Actif",
    };

    if (mode === "create") {
      if (list.some((p) => p.ref.toLowerCase() === row.ref.toLowerCase())) {
        toast.error("Cette référence existe déjà.");
        return;
      }
      const next = [row, ...list];
      setList(next);
      saveProduits(next);
      toast.success("Produit enregistré.");
      reset(emptyForm(nextProduitRef(next)));
      setMode("idle");
      return;
    }

    const prev = list.find((p) => p.ref === row.ref);
    if (!prev) {
      toast.error("Produit introuvable.");
      return;
    }
    const next = list.map((p) => (p.ref === row.ref ? row : p));
    setList(next);
    saveProduits(next);
    toast.success("Produit modifié.");
    reset(emptyForm(nextProduitRef(next)));
    setMode("idle");
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
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/40 p-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] md:p-4"
      >
        <div className="flex flex-wrap items-end gap-x-3 gap-y-3">
          <div className="min-w-[110px] flex-[0.7]">
            <Field label="Réf" error={errors.ref?.message}>
              <Input
                {...register("ref")}
                readOnly
                className={`${inputReadonly} font-semibold text-brand`}
              />
            </Field>
          </div>
          <div className="min-w-[140px] flex-[1.2]">
            <Field label="Désignation" error={errors.designation?.message}>
              <Input
                {...register("designation")}
                placeholder="Ex. Papier A4 80g"
                readOnly={fieldsLocked}
                className={fieldsLocked ? inputReadonly : inputShell}
                autoFocus={mode === "create" || mode === "edit"}
              />
            </Field>
          </div>
          <div className="min-w-[90px] flex-[0.55]">
            <Field label="Qte Initiale" error={errors.qteInitiale?.message}>
              <Input
                {...register("qteInitiale")}
                inputMode="decimal"
                readOnly={fieldsLocked}
                className={`${fieldsLocked ? inputReadonly : inputShell} tabular-nums`}
              />
            </Field>
          </div>
          <div className="min-w-[90px] flex-[0.55]">
            <Field label="Achats">
              <Input
                value={String(achatsFacture)}
                readOnly
                title="Somme des qté (réf produit) sur Facture Achat"
                className={`${inputReadonly} tabular-nums`}
              />
            </Field>
          </div>
          <div className="min-w-[90px] flex-[0.55]">
            <Field label="Stock Final">
              <Input
                value={String(stockFinal)}
                readOnly
                className={`${inputReadonly} font-bold tabular-nums text-brand`}
              />
            </Field>
          </div>
          <div className="min-w-[100px] flex-[0.8]">
            <Field label="P/A" error={errors.prixAchat?.message}>
              <Input
                {...register("prixAchat")}
                inputMode="decimal"
                readOnly={fieldsLocked}
                className={`${fieldsLocked ? inputReadonly : inputShell} font-semibold tabular-nums`}
              />
            </Field>
          </div>
          <div className="min-w-[100px] flex-[0.8]">
            <Field label="P/V" error={errors.prixVente?.message}>
              <Input
                {...register("prixVente")}
                inputMode="decimal"
                readOnly={fieldsLocked}
                className={`${fieldsLocked ? inputReadonly : inputShell} font-semibold tabular-nums`}
              />
            </Field>
          </div>
          <div className="min-w-[100px] flex-[0.65]">
            <Field label="Statut" error={errors.actif?.message}>
              <select
                {...register("actif")}
                className={selectClass}
                disabled={fieldsLocked}
              >
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 pb-0.5">
            <Button type="button" onClick={openNouveau} disabled={mode === "create"}>
              <Plus className="h-4 w-4" />
              Nouveau
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (mode !== "create" && mode !== "edit")}
            >
              Valider
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onAnnuler}
              disabled={mode === "idle"}
            >
              Annuler
            </Button>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Réf</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Désignation</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Qte Initiale</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Achats</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Stock Final</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center text-sm text-muted">
                    Aucun produit. Cliquez sur{" "}
                    <span className="font-semibold text-ink">Nouveau</span>.
                  </td>
                </tr>
              ) : (
                sorted.map((p, i) => {
                  const achats = qteAcheteeProduit(p.ref);
                  const stockFinalRow = stockFinalBalance(p.qteInitiale, p.ref);
                  return (
                  <tr
                    key={p.ref}
                    className={`border-t border-slate-100 hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                        {p.ref}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">{p.designation}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {p.qteInitiale}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {achats}
                    </td>
                    <td className="px-3 py-3 font-bold tabular-nums text-brand">
                      {stockFinalRow}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 p-1">
                        <ActionBtn
                          label="Voir"
                          onClick={() => openView(p)}
                          className="text-sky-700 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Modifier"
                          onClick={() => openEdit(p)}
                          className="text-amber-700 hover:bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Imprimer"
                          onClick={() => printProduit(p)}
                          className="text-slate-700 hover:bg-white"
                        >
                          <Printer className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Supprimer"
                          onClick={() => onDelete(p)}
                          className="text-rose-700 hover:bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionBtn>
                      </div>
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

function ActionBtn({
  label,
  onClick,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
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

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="block w-full text-center text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
        <span className="bg-gradient-to-r from-brand to-violet bg-clip-text text-transparent">
          {label}
        </span>
      </Label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
