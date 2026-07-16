"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, FileDown, Pencil, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, moneyTone, toMoneyInput } from "@/lib/money";
import { loadFacturesAchat, type FactureAchat } from "@/lib/factures-achat";
import {
  TYPES_REGLEMENT,
  calcSolde,
  formatDateFR,
  loadReglements,
  nextReglementId,
  saveReglements,
  todayISO,
  type ReglementFournisseur,
} from "@/lib/reglements-fournisseur";
import type { TypeReglement } from "@/lib/fournisseurs";

const schema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  factureId: z.string().min(1, "Réf facture obligatoire"),
  refFacture: z.string().min(1),
  fournisseurId: z.string().min(1),
  nomFournisseur: z.string().min(1),
  montantFacture: z.string().min(1),
  montantPaye: z
    .string()
    .min(1, "Montant payé obligatoire")
    .refine(
      (v) => Number.isFinite(Number(v.replace(/\s/g, "").replace(",", "."))),
      { message: "Montant invalide" }
    ),
  solde: z.string().min(1),
  modeReglement: z.enum([
    "Esp",
    "Chq",
    "Vir",
    "Eff",
    "Vers",
    "Autre",
  ]),
  numeroRegl: z.string().optional(),
  bnqRegl: z.string().optional(),
  nomTire: z.string().optional(),
  dateDecaisse: z.string().min(1, "Date Décaiss obligatoire"),
  statut: z.enum(["Oui", "Non"]),
});

type FormValues = z.infer<typeof schema>;
type FormMode = "create" | "edit" | "view";

const selectClass =
  "flex h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-sm font-medium text-ink transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const inputShell =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 text-center shadow-none transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-0";

const inputReadonly =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-3 text-center font-medium text-slate-700 shadow-none focus-visible:ring-0";

function parseMoney(value: string): number {
  const n = Number(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function toFormValues(r: ReglementFournisseur): FormValues {
  return {
    id: r.id,
    date: r.date,
    factureId: r.factureId,
    refFacture: r.refFacture,
    fournisseurId: r.fournisseurId,
    nomFournisseur: r.nomFournisseur,
    montantFacture: toMoneyInput(r.montantFacture),
    montantPaye: toMoneyInput(r.montantPaye),
    solde: toMoneyInput(r.solde),
    modeReglement: r.modeReglement,
    numeroRegl: r.numeroRegl || "",
    bnqRegl: r.bnqRegl || "",
    nomTire: r.nomTire || "",
    dateDecaisse: r.dateDecaisse,
    statut: r.statut ?? "Non",
  };
}

function reglementHtml(r: ReglementFournisseur): string {
  const rows = [
    ["Date", formatDateFR(r.date)],
    ["Réf Facture", r.refFacture],
    ["Nom Fournisseur", r.nomFournisseur],
    ["Mnt Fact", formatMoney(r.montantFacture)],
    ["Mnt Payé", formatMoney(r.montantPaye)],
    ["Solde", formatMoney(r.solde)],
    ["Règl", r.modeReglement],
    ["N° Règl", r.numeroRegl || "—"],
    ["Bnq Règl", r.bnqRegl || "—"],
    ["Nom Tiré", r.nomTire || "—"],
    ["Date Décaiss", formatDateFR(r.dateDecaisse)],
    ["Statut", r.statut ?? "Non"],
  ]
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;width:40%">${k}</th><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${v}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Règlement ${r.id}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  p{color:#666;margin:0 0 24px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  @media print{body{padding:0}}
</style></head><body>
  <h1>SpeedyPrint — Règlement Fournisseur</h1>
  <p>${r.refFacture} · ${r.nomFournisseur}</p>
  <table>${rows}</table>
</body></html>`;
}

function printReglement(r: ReglementFournisseur) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!win) {
    toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }
  win.document.write(
    reglementHtml(r) +
      `<script>window.onload=function(){window.print()}</script>`
  );
  win.document.close();
}

function downloadPdf(r: ReglementFournisseur) {
  const html = reglementHtml(r);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reglement-${r.id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast.success("Fichier téléchargé — ouvrez-le puis Enregistrer en PDF.");
}

export default function ReglementFournisseurPage() {
  const [list, setList] = useState<ReglementFournisseur[]>([]);
  const [factures, setFactures] = useState<FactureAchat[]>([]);
  const [mode, setMode] = useState<FormMode | null>(null);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      id: "REG-0001",
      date: todayISO(),
      factureId: "",
      refFacture: "",
      fournisseurId: "",
      nomFournisseur: "",
      montantFacture: "0.00",
      montantPaye: "0.00",
      solde: "0.00",
      modeReglement: "Vir",
      numeroRegl: "",
      bnqRegl: "",
      nomTire: "",
      dateDecaisse: todayISO(),
      statut: "Non",
    },
  });

  const watchFactureId = useWatch({ control, name: "factureId" });
  const watchMontantFacture = useWatch({ control, name: "montantFacture" });
  const watchMontantPaye = useWatch({ control, name: "montantPaye" });
  const watchModeReglement = useWatch({ control, name: "modeReglement" });
  const reglSansCheque =
    watchModeReglement === "Esp" ||
    watchModeReglement === "Vir" ||
    watchModeReglement === "Vers";

  useEffect(() => {
    setList(loadReglements());
    setFactures(loadFacturesAchat());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!mode || mode === "view") return;
    const solde = calcSolde(
      parseMoney(watchMontantFacture || "0"),
      parseMoney(watchMontantPaye || "0")
    );
    setValue("solde", toMoneyInput(solde), { shouldDirty: false });
  }, [watchMontantFacture, watchMontantPaye, mode, setValue]);

  useEffect(() => {
    if (!mode || mode === "view") return;
    if (
      watchModeReglement === "Esp" ||
      watchModeReglement === "Vir" ||
      watchModeReglement === "Vers"
    ) {
      setValue("numeroRegl", "", { shouldDirty: false });
      setValue("bnqRegl", "", { shouldDirty: false });
    }
  }, [watchModeReglement, mode, setValue]);

  const sorted = useMemo(
    () =>
      [...list].sort((a, b) => {
        if (a.date === b.date) return b.id.localeCompare(a.id);
        return b.date.localeCompare(a.date);
      }),
    [list]
  );

  const readOnly = mode === "view";
  const pieceDisabled =
    readOnly ||
    watchModeReglement === "Esp" ||
    watchModeReglement === "Vir" ||
    watchModeReglement === "Vers";

  function openNouveau() {
    const id = nextReglementId(list);
    reset({
      id,
      date: todayISO(),
      factureId: "",
      refFacture: "",
      fournisseurId: "",
      nomFournisseur: "",
      montantFacture: "0.00",
      montantPaye: "0.00",
      solde: "0.00",
      modeReglement: "Vir",
      numeroRegl: "",
      bnqRegl: "",
      nomTire: "",
      dateDecaisse: todayISO(),
      statut: "Non",
    });
    setMode("create");
  }

  function openView(r: ReglementFournisseur) {
    reset(toFormValues(r));
    setMode("view");
  }

  function openEdit(r: ReglementFournisseur) {
    reset(toFormValues(r));
    setMode("edit");
  }

  function closeForm() {
    setMode(null);
  }

  function onFactureChange(factureId: string) {
    const f = factures.find((x) => x.id === factureId);
    const mf = f?.montantFacture ?? 0;
    setValue("factureId", factureId, { shouldValidate: true });
    setValue("refFacture", f?.numeroFacture ?? "", { shouldValidate: true });
    setValue("fournisseurId", f?.fournisseurId ?? "", { shouldValidate: true });
    setValue("nomFournisseur", f?.nomFournisseur ?? "", { shouldValidate: true });
    setValue("montantFacture", toMoneyInput(mf));
    setValue("montantPaye", "0.00");
    setValue("solde", toMoneyInput(mf));
    if (f?.typeReglement) {
      setValue("modeReglement", f.typeReglement);
    }
    if (f?.echeance) {
      setValue("dateDecaisse", f.echeance);
    }
  }

  function onDelete(r: ReglementFournisseur) {
    const ok = window.confirm(
      `Supprimer le règlement « ${r.id} » (${r.refFacture}) ?`
    );
    if (!ok) return;
    const next = list.filter((x) => x.id !== r.id);
    setList(next);
    saveReglements(next);
    if (mode && getValues("id") === r.id) setMode(null);
    toast.success("Règlement supprimé.");
  }

  function onSubmit(values: FormValues) {
    if (mode === "view") return;

    const montantFacture = parseMoney(values.montantFacture);
    const montantPaye = parseMoney(values.montantPaye);
    const solde = calcSolde(montantFacture, montantPaye);

    const row: ReglementFournisseur = {
      id: values.id,
      date: values.date,
      factureId: values.factureId,
      refFacture: values.refFacture.trim(),
      fournisseurId: values.fournisseurId,
      nomFournisseur: values.nomFournisseur.trim(),
      montantFacture,
      montantPaye,
      solde,
      modeReglement: values.modeReglement as TypeReglement,
      numeroRegl: (values.numeroRegl ?? "").trim(),
      bnqRegl: (values.bnqRegl ?? "").trim(),
      nomTire: (values.nomTire ?? "").trim(),
      dateDecaisse: values.dateDecaisse,
      statut: values.statut,
    };

    if (mode === "create") {
      const next = [row, ...list];
      setList(next);
      saveReglements(next);
      toast.success("Règlement enregistré.");
      setMode(null);
      return;
    }

    if (mode === "edit") {
      const next = list.map((x) => (x.id === row.id ? row : x));
      setList(next);
      saveReglements(next);
      toast.success("Règlement modifié.");
      setMode(null);
    }
  }

  if (!ready) {
    return (
      <div className="p-4 md:p-6">
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-2 px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2">
      {!mode && (
        <div className="flex justify-end">
          <Button type="button" onClick={openNouveau}>
            <Plus className="h-4 w-4" />
            Nouveau Règlement
          </Button>
        </div>
      )}

      {mode && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/40 p-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] md:p-4"
        >
          {/* Même style que le modèle : une bande de champs */}
          <div className="flex flex-wrap gap-x-3 gap-y-3">
            <div className="min-w-[128px] flex-[0.55]">
              <Field label="Date" error={errors.date?.message}>
                <Input
                  {...register("date")}
                  type="date"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} px-1.5 text-[13px]`}
                />
              </Field>
            </div>

            <div className="min-w-[140px] flex-[1.05]">
              <Field label="Réf Facture" error={errors.factureId?.message}>
                <select
                  className={selectClass}
                  disabled={readOnly}
                  value={watchFactureId || ""}
                  onChange={(e) => onFactureChange(e.target.value)}
                >
                  <option value="">— Sélectionner —</option>
                  {factures.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.numeroFacture}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="min-w-[230px] flex-[2.1]">
              <Field label="Nom Fournisseur">
                <Input
                  {...register("nomFournisseur")}
                  readOnly
                  className={inputReadonly}
                  placeholder="Auto"
                />
              </Field>
            </div>

            <div className="min-w-[130px] flex-1">
              <Field label="Mnt Fact" error={errors.montantFacture?.message}>
                <Input
                  {...register("montantFacture")}
                  readOnly
                  className={`${inputReadonly} ${moneyTone.facture}`}
                />
              </Field>
            </div>

            <div className="min-w-[130px] flex-1">
              <Field label="Mnt Payé" error={errors.montantPaye?.message}>
                <Input
                  {...register("montantPaye")}
                  inputMode="decimal"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} ${moneyTone.paye}`}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <div className="min-w-[120px] flex-1">
              <Field label="Solde" error={errors.solde?.message}>
                <Input
                  {...register("solde")}
                  readOnly
                  className={`${inputReadonly} ${moneyTone.solde}`}
                />
              </Field>
            </div>

            <div className="min-w-[100px] flex-[0.65]">
              <Field label="Règl" error={errors.modeReglement?.message}>
                <select
                  {...register("modeReglement")}
                  className={selectClass}
                  disabled={readOnly}
                >
                  {TYPES_REGLEMENT.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="min-w-[110px] flex-[0.75]">
              <Field label="N° Règl" error={errors.numeroRegl?.message}>
                <Input
                  {...register("numeroRegl")}
                  placeholder=""
                  readOnly={pieceDisabled}
                  className={pieceDisabled ? inputReadonly : inputShell}
                />
              </Field>
            </div>

            <div className="min-w-[100px] flex-[0.7]">
              <Field label="Bnq Règl" error={errors.bnqRegl?.message}>
                <Input
                  {...register("bnqRegl")}
                  placeholder=""
                  readOnly={pieceDisabled}
                  className={pieceDisabled ? inputReadonly : inputShell}
                />
              </Field>
            </div>

            <div className="min-w-[180px] flex-[1.4]">
              <Field label="Nom Tiré" error={errors.nomTire?.message}>
                <Input
                  {...register("nomTire")}
                  placeholder="Nom du tiré"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                />
              </Field>
            </div>

            <div className="min-w-[165px] flex-[0.9]">
              <Field label="Date Décaiss" error={errors.dateDecaisse?.message}>
                <Input
                  {...register("dateDecaisse")}
                  type="date"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} min-w-[150px] px-2.5 text-[13px]`}
                />
              </Field>
            </div>

            <div className="min-w-[110px] flex-[0.8]">
              <Field label="Statut" error={errors.statut?.message}>
                <select
                  {...register("statut")}
                  className={selectClass}
                  disabled={readOnly}
                >
                  <option value="Oui">Oui</option>
                  <option value="Non">Non</option>
                </select>
              </Field>
            </div>
          </div>

          <input type="hidden" {...register("id")} />
          <input type="hidden" {...register("refFacture")} />
          <input type="hidden" {...register("factureId")} />
          <input type="hidden" {...register("fournisseurId")} />

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100/80 pt-3">
            {mode === "view" ? (
              <Button type="button" variant="outline" onClick={closeForm}>
                Fermer
              </Button>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={closeForm}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  Valider
                </Button>
              </>
            )}
          </div>
        </form>
      )}

      {!mode && (
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Date</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Réf Facture</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">
                  Nom Fournisseur
                </th>
                <th className="px-3 py-3.5 text-[12px] font-bold">
                  Mnt Fact
                </th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Mnt Payé</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Solde</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Règl</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">N° Règl</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Bnq Règl</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Nom Tiré</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Date Décaiss</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Statut</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-14 text-center text-sm text-muted"
                  >
                    Aucun règlement. Cliquez sur{" "}
                    <span className="font-semibold text-ink">
                      Nouveau Règlement
                    </span>
                    .
                  </td>
                </tr>
              ) : (
                sorted.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-t border-slate-100 hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {formatDateFR(r.date)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">
                      {r.refFacture}
                    </td>
                    <td className="px-3 py-3 font-semibold">
                      {r.nomFournisseur}
                    </td>
                    <td className={`px-3 py-3 ${moneyTone.facture}`}>
                      {formatMoney(r.montantFacture)}
                    </td>
                    <td className={`px-3 py-3 ${moneyTone.paye}`}>
                      {formatMoney(r.montantPaye)}
                    </td>
                    <td className={`px-3 py-3 ${moneyTone.solde}`}>
                      {formatMoney(r.solde)}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {r.modeReglement}
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">
                      {r.numeroRegl || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {r.bnqRegl || "—"}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {r.nomTire || "—"}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {formatDateFR(r.dateDecaisse)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex rounded-lg px-2 py-0.5 text-xs font-bold ${
                          (r.statut ?? "Non") === "Oui"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {r.statut ?? "Non"}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center justify-center gap-0.5 rounded-xl bg-slate-100/80 p-1">
                        <ActionBtn
                          label="Voir"
                          onClick={() => openView(r)}
                          className="text-sky-700 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Modifier"
                          onClick={() => openEdit(r)}
                          className="text-amber-700 hover:bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Supprimer"
                          onClick={() => onDelete(r)}
                          className="text-rose-700 hover:bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Imprimer"
                          onClick={() => printReglement(r)}
                          className="text-slate-700 hover:bg-white"
                        >
                          <Printer className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="PDF"
                          onClick={() => downloadPdf(r)}
                          className="text-violet-700 hover:bg-white"
                        >
                          <FileDown className="h-4 w-4" />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
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
