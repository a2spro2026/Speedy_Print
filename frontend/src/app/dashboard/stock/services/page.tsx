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
import {
  UNITES_SERVICE,
  loadServices,
  nextServiceRef,
  saveServices,
  type Service,
} from "@/lib/services";

const schema = z.object({
  ref: z.string().min(1),
  designation: z.string().min(1, "Désignation obligatoire"),
  unite: z.string().min(1, "U obligatoire"),
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
  return { ref, designation: "", unite: "U", prixVente: "0.00", actif: "Actif" };
}

function toFormValues(s: Service): FormValues {
  return {
    ref: s.ref,
    designation: s.designation,
    unite: s.unite || "U",
    prixVente: toMoneyInput(s.prixVente),
    actif: s.actif === false ? "Inactif" : "Actif",
  };
}

function printService(s: Service) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!win) {
    toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }
  const rows = [
    ["Réf", s.ref],
    ["Désignation", s.designation],
    ["U", s.unite],
    ["P/V", formatMoney(s.prixVente)],
    ["Statut", s.actif === false ? "Inactif" : "Actif"],
  ]
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;width:40%">${k}</th><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${v}</td></tr>`
    )
    .join("");
  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Fiche Service ${s.ref}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  p{color:#666;margin:0 0 24px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  @media print{body{padding:0}}
</style></head><body>
  <h1>SpeedyPrint — Fiche Service</h1>
  <p>${s.designation} · ${s.ref}</p>
  <table>${rows}</table>
  <script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}

export default function FicheServicePage() {
  const [list, setList] = useState<Service[]>([]);
  const [mode, setMode] = useState<FormMode>("idle");
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm("Srv0001"),
  });

  useEffect(() => {
    const data = loadServices();
    setList(data);
    reset(emptyForm(nextServiceRef(data)));
    setReady(true);
  }, [reset]);

  const sorted = useMemo(
    () => [...list].sort((a, b) => a.ref.localeCompare(b.ref, undefined, { numeric: true })),
    [list]
  );

  const fieldsLocked = mode === "view" || mode === "idle";

  function openNouveau() {
    reset(emptyForm(nextServiceRef(list)));
    setMode("create");
  }

  function openView(s: Service) {
    reset(toFormValues(s));
    setMode("view");
  }

  function openEdit(s: Service) {
    reset(toFormValues(s));
    setMode("edit");
  }

  function onAnnuler() {
    reset(emptyForm(nextServiceRef(list)));
    setMode("idle");
  }

  function onDelete(s: Service) {
    const ok = window.confirm(`Supprimer le service « ${s.designation} » (${s.ref}) ?`);
    if (!ok) return;
    const next = list.filter((x) => x.ref !== s.ref);
    setList(next);
    saveServices(next);
    if (getValues("ref") === s.ref) {
      reset(emptyForm(nextServiceRef(next)));
      setMode("idle");
    }
    toast.success("Service supprimé.");
  }

  function onSubmit(values: FormValues) {
    if (mode !== "create" && mode !== "edit") return;

    const row: Service = {
      ref: values.ref.trim(),
      designation: values.designation.trim(),
      unite: values.unite.trim() || "U",
      prixVente: parseNum(values.prixVente),
      actif: values.actif === "Actif",
    };

    if (mode === "create") {
      if (list.some((s) => s.ref.toLowerCase() === row.ref.toLowerCase())) {
        toast.error("Cette référence existe déjà.");
        return;
      }
      const next = [row, ...list];
      setList(next);
      saveServices(next);
      toast.success("Service enregistré.");
      reset(emptyForm(nextServiceRef(next)));
      setMode("idle");
      return;
    }

    const prev = list.find((s) => s.ref === row.ref);
    if (!prev) {
      toast.error("Service introuvable.");
      return;
    }
    const next = list.map((s) => (s.ref === row.ref ? row : s));
    setList(next);
    saveServices(next);
    toast.success("Service modifié.");
    reset(emptyForm(nextServiceRef(next)));
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
          <div className="min-w-[120px] flex-[0.6]">
            <Field label="Réf" error={errors.ref?.message}>
              <Input
                {...register("ref")}
                readOnly
                className={`${inputReadonly} font-semibold text-brand`}
              />
            </Field>
          </div>
          <div className="min-w-[200px] flex-[2]">
            <Field label="Désignation" error={errors.designation?.message}>
              <Input
                {...register("designation")}
                placeholder="Ex. Impression A3 couleur"
                readOnly={fieldsLocked}
                className={fieldsLocked ? inputReadonly : inputShell}
                autoFocus={mode === "create" || mode === "edit"}
              />
            </Field>
          </div>
          <div className="min-w-[90px] flex-[0.5]">
            <Field label="U" error={errors.unite?.message}>
              <select
                {...register("unite")}
                className={selectClass}
                disabled={fieldsLocked}
              >
                {UNITES_SERVICE.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="min-w-[110px] flex-[0.7]">
            <Field label="P/V" error={errors.prixVente?.message}>
              <Input
                {...register("prixVente")}
                inputMode="decimal"
                readOnly={fieldsLocked}
                className={`${fieldsLocked ? inputReadonly : inputShell} font-semibold tabular-nums`}
              />
            </Field>
          </div>
          <div className="min-w-[100px] flex-[0.6]">
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
          <table className="w-full min-w-[640px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Réf</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Désignation</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">U</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">P/V</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center text-sm text-muted">
                    Aucun service. Cliquez sur{" "}
                    <span className="font-semibold text-ink">Nouveau</span>.
                  </td>
                </tr>
              ) : (
                sorted.map((s, i) => (
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
                    <td className="px-3 py-3 font-semibold text-ink">{s.designation}</td>
                    <td className="px-3 py-3 text-slate-600">{s.unite}</td>
                    <td className="px-3 py-3 font-bold tabular-nums text-slate-800">
                      {formatMoney(s.prixVente)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 p-1">
                        <ActionBtn
                          label="Voir"
                          onClick={() => openView(s)}
                          className="text-sky-700 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Modifier"
                          onClick={() => openEdit(s)}
                          className="text-amber-700 hover:bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Imprimer"
                          onClick={() => printService(s)}
                          className="text-slate-700 hover:bg-white"
                        >
                          <Printer className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Supprimer"
                          onClick={() => onDelete(s)}
                          className="text-rose-700 hover:bg-white"
                        >
                          <Trash2 className="h-4 w-4" />
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
      {error ? <p className="text-center text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
