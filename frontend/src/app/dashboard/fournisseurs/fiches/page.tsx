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
  TYPES_REGLEMENT,
  formatDateFR,
  loadFournisseurs,
  nextFournisseurId,
  saveFournisseurs,
  todayISO,
  type Fournisseur,
  type TypeReglement,
} from "@/lib/fournisseurs";

const schema = z.object({
  date: z.string().min(1),
  id: z.string().min(1),
  nom: z.string().min(1, "Nom fournisseur obligatoire"),
  contact: z.string().optional(),
  ville: z.string().optional(),
  typeReglement: z.enum([
    "Esp",
    "Chq",
    "Vir",
    "Eff",
    "Vers",
    "Autre",
  ]),
  banque: z.string().optional(),
  rc: z.string().optional(),
  ice: z.string().optional(),
  rib: z.string().optional(),
  soldeInitial: z
    .string()
    .min(1, "Solde initial obligatoire")
    .refine((v) => Number.isFinite(Number(v.replace(/\s/g, "").replace(",", "."))), {
      message: "Montant invalide",
    }),
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

function toFormValues(f: Fournisseur): FormValues {
  return {
    date: f.date,
    id: f.id,
    nom: f.nom,
    contact: f.contact,
    ville: f.ville,
    typeReglement: f.typeReglement,
    banque: f.banque,
    rc: f.rc,
    ice: f.ice,
    rib: f.rib,
    soldeInitial: toMoneyInput(f.soldeInitial),
  };
}

function printFournisseur(f: Fournisseur) {
  const win = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!win) {
    toast.error("Impossible d'ouvrir la fenêtre d'impression.");
    return;
  }

  const rows = [
    ["Date", formatDateFR(f.date)],
    ["ID", f.id],
    ["Nom Fournisseur", f.nom],
    ["Contact", f.contact],
    ["Ville", f.ville],
    ["Type Règlement", f.typeReglement],
    ["Banque", f.banque || "—"],
    ["RC", f.rc || "—"],
    ["ICE", f.ice || "—"],
    ["RIB", f.rib || "—"],
    ["Solde Initial", formatMoney(f.soldeInitial)],
  ]
    .map(
      ([k, v]) =>
        `<tr><th style="text-align:left;padding:8px 12px;border-bottom:1px solid #e5e7eb;width:40%">${k}</th><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${v}</td></tr>`
    )
    .join("");

  win.document.write(`<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Fiche Fournisseur ${f.id}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;color:#111;padding:32px;max-width:720px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  p{color:#666;margin:0 0 24px;font-size:14px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  @media print{body{padding:0}}
</style></head><body>
  <h1>SpeedyPrint — Fiche Fournisseur</h1>
  <p>${f.nom} · ${f.id}</p>
  <table>${rows}</table>
  <script>window.onload=function(){window.print()}</script>
</body></html>`);
  win.document.close();
}

export default function FicheFournisseurPage() {
  const [list, setList] = useState<Fournisseur[]>([]);
  const [mode, setMode] = useState<FormMode | null>(null);
  const [ready, setReady] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchFournisseur, setSearchFournisseur] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayISO(),
      id: "FRN-0001",
      nom: "",
      contact: "",
      ville: "",
      typeReglement: "Vir",
      banque: "",
      rc: "",
      ice: "",
      rib: "",
      soldeInitial: "0.00",
    },
  });

  useEffect(() => {
    setList(loadFournisseurs());
    setReady(true);
  }, []);

  const sorted = useMemo(
    () =>
      [...list].sort((a, b) => {
        if (a.date === b.date) return b.id.localeCompare(a.id);
        return b.date.localeCompare(a.date);
      }),
    [list]
  );

  const filtered = useMemo(() => {
    const q = searchFournisseur.trim().toLowerCase();
    return sorted.filter((f) => {
      if (dateFrom && f.date < dateFrom) return false;
      if (dateTo && f.date > dateTo) return false;
      if (q && !f.nom.toLowerCase().includes(q) && !f.id.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [sorted, dateFrom, dateTo, searchFournisseur]);

  const readOnly = mode === "view";

  function openNouveau() {
    reset({
      date: todayISO(),
      id: nextFournisseurId(list),
      nom: "",
      contact: "",
      ville: "",
      typeReglement: "Vir",
      banque: "",
      rc: "",
      ice: "",
      rib: "",
      soldeInitial: "0.00",
    });
    setMode("create");
  }

  function openView(f: Fournisseur) {
    reset(toFormValues(f));
    setMode("view");
  }

  function openEdit(f: Fournisseur) {
    reset(toFormValues(f));
    setMode("edit");
  }

  function closeForm() {
    setMode(null);
  }

  function onDelete(f: Fournisseur) {
    const ok = window.confirm(
      `Supprimer le fournisseur « ${f.nom} » (${f.id}) ?`
    );
    if (!ok) return;
    const next = list.filter((x) => x.id !== f.id);
    setList(next);
    saveFournisseurs(next);
    if (mode && getValues("id") === f.id) {
      setMode(null);
    }
    toast.success("Fournisseur supprimé.");
  }

  function onSubmit(values: FormValues) {
    if (mode === "view") return;

    if (mode === "create") {
      if (list.some((f) => f.id === values.id)) {
        toast.error("Cet ID fournisseur existe déjà.");
        return;
      }
      const row: Fournisseur = {
        id: values.id,
        date: values.date,
        nom: values.nom.trim(),
        contact: (values.contact ?? "").trim(),
        ville: (values.ville ?? "").trim(),
        typeReglement: values.typeReglement as TypeReglement,
        banque: (values.banque ?? "").trim(),
        rc: (values.rc ?? "").trim(),
        ice: (values.ice ?? "").trim(),
        rib: (values.rib ?? "").trim(),
        soldeInitial: parseMoney(values.soldeInitial),
      };
      const next = [row, ...list];
      setList(next);
      saveFournisseurs(next);
      toast.success("Fournisseur enregistré.");
      setMode(null);
      return;
    }

    if (mode === "edit") {
      const prev = list.find((f) => f.id === values.id);
      if (!prev) {
        toast.error("Fournisseur introuvable.");
        return;
      }
      const row: Fournisseur = {
        ...prev,
        date: values.date,
        nom: values.nom.trim(),
        contact: (values.contact ?? "").trim(),
        ville: (values.ville ?? "").trim(),
        typeReglement: values.typeReglement as TypeReglement,
        banque: (values.banque ?? "").trim(),
        rc: (values.rc ?? "").trim(),
        ice: (values.ice ?? "").trim(),
        rib: (values.rib ?? "").trim(),
        soldeInitial: parseMoney(values.soldeInitial),
      };
      const next = list.map((f) => (f.id === row.id ? row : f));
      setList(next);
      saveFournisseurs(next);
      toast.success("Fournisseur modifié.");
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
            Nouveau Fournisseur
          </Button>
        </div>
      )}

      {mode && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/40 p-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] md:p-4"
        >
          <div className="flex flex-wrap gap-x-3 gap-y-3">
            <div className="min-w-[128px] flex-[0.55]">
              <Field label="Date" error={errors.date?.message}>
                <Input
                  {...register("date")}
                  type="date"
                  readOnly
                  className={`${inputReadonly} px-1.5 text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[140px] flex-[1.1]">
              <Field label="ID" error={errors.id?.message}>
                <Input
                  {...register("id")}
                  readOnly
                  className={`${inputReadonly} font-semibold text-brand`}
                />
              </Field>
            </div>
            <div className="min-w-[240px] flex-[2.1]">
              <Field label="Nom Fournisseur" error={errors.nom?.message}>
                <Input
                  {...register("nom")}
                  placeholder="Ex. Papeterie Atlas"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                  autoFocus={!readOnly}
                />
              </Field>
            </div>
            <div className="min-w-[140px] flex-1">
              <Field label="Contact" error={errors.contact?.message}>
                <Input
                  {...register("contact")}
                  placeholder="Tél. / email"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                />
              </Field>
            </div>
            <div className="min-w-[120px] flex-1">
              <Field label="Ville" error={errors.ville?.message}>
                <Input
                  {...register("ville")}
                  placeholder="Casablanca"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                />
              </Field>
            </div>
            <div className="min-w-[100px] flex-[0.65]">
              <Field label="Règlement" error={errors.typeReglement?.message}>
                <select
                  {...register("typeReglement")}
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
            <div className="min-w-[140px] flex-1">
              <Field label="Banque" error={errors.banque?.message}>
                <Input
                  {...register("banque")}
                  placeholder="Attijari / BMCE…"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                />
              </Field>
            </div>
            <div className="min-w-[120px] flex-1">
              <Field label="RC" error={errors.rc?.message}>
                <Input
                  {...register("rc")}
                  placeholder="Registre de commerce"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} font-mono text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[120px] flex-1">
              <Field label="ICE" error={errors.ice?.message}>
                <Input
                  {...register("ice")}
                  placeholder="ICE"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} font-mono text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[180px] flex-[1.2]">
              <Field label="RIB" error={errors.rib?.message}>
                <Input
                  {...register("rib")}
                  placeholder="RIB"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} font-mono text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[130px] flex-1">
              <Field label="Solde Initial" error={errors.soldeInitial?.message}>
                <Input
                  {...register("soldeInitial")}
                  inputMode="decimal"
                  placeholder="0.00"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} font-semibold tabular-nums`}
                />
              </Field>
            </div>
          </div>

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
      <>
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm md:p-4">
        <div className="min-w-[140px] flex-[0.8]">
          <Field label="Date de">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={`${inputShell} px-1.5 text-[13px]`}
            />
          </Field>
        </div>
        <div className="min-w-[140px] flex-[0.8]">
          <Field label="Date à">
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={`${inputShell} px-1.5 text-[13px]`}
            />
          </Field>
        </div>
        <div className="min-w-[220px] flex-[2]">
          <Field label="Fournisseur">
            <Input
              value={searchFournisseur}
              onChange={(e) => setSearchFournisseur(e.target.value)}
              placeholder="Nom ou ID fournisseur…"
              className={inputShell}
            />
          </Field>
        </div>
        {(dateFrom || dateTo || searchFournisseur) && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
              setSearchFournisseur("");
            }}
          >
            Réinitialiser
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Date</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">ID</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">
                  Nom Fournisseur
                </th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Contact</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Ville</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">ICE</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">RC</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">
                  Solde Initial
                </th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center text-sm text-muted"
                  >
                    {sorted.length === 0 ? (
                      <>
                        Aucun fournisseur. Cliquez sur{" "}
                        <span className="font-semibold text-ink">
                          Nouveau Fournisseur
                        </span>
                        .
                      </>
                    ) : (
                      "Aucun résultat pour ces critères."
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map((f, i) => (
                  <tr
                    key={f.id}
                    className={`border-t border-slate-100 hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {formatDateFR(f.date)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                        {f.id}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink">{f.nom}</td>
                    <td className="px-3 py-3 text-slate-600">{f.contact}</td>
                    <td className="px-3 py-3 text-slate-600">{f.ville}</td>
                    <td className="px-3 py-3 font-mono text-[12px] text-slate-600">
                      {f.ice || "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-[12px] text-slate-600">
                      {f.rc || "—"}
                    </td>
                    <td className="px-3 py-3 font-bold tabular-nums text-slate-800">
                      {formatMoney(f.soldeInitial)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-1 rounded-xl bg-slate-100/80 p-1">
                        <ActionBtn
                          label="Voir"
                          onClick={() => openView(f)}
                          className="text-sky-700 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Modifier"
                          onClick={() => openEdit(f)}
                          className="text-amber-700 hover:bg-white"
                        >
                          <Pencil className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Imprimer"
                          onClick={() => printFournisseur(f)}
                          className="text-slate-700 hover:bg-white"
                        >
                          <Printer className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Supprimer"
                          onClick={() => onDelete(f)}
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
      </>
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
