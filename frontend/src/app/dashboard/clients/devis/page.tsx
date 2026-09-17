"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, ArrowRightLeft, FileText, Pencil, Plus, Printer, Receipt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CatalogSuggestInput,
  buildCatalogSuggestItems,
  type CatalogSuggestItem,
} from "@/components/ui/catalog-suggest-input";
import { DateFrInput } from "@/components/ui/date-fr-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatMoney, moneyTone, toMoneyInput } from "@/lib/money";
import {
  loadClients,
  normalizeNomClient,
  upsertClientFromDocument,
  type Client,
} from "@/lib/clients";
import {
  ensureCatalogItem,
  inferCatalogKind,
  type CatalogKind,
} from "@/lib/ensure-catalog-item";
import { loadProduits, type Produit } from "@/lib/produits";
import { loadServices, type Service } from "@/lib/services";
import { printDevis } from "@/lib/print-devis";
import {
  factureFromDevis,
  isDevisConverted,
  loadFacturesVente,
  saveFacturesVente,
  syncClientSoldeOnFactureCreate,
} from "@/lib/factures-vente";
import {
  TYPES_REGLEMENT,
  UNITES,
  calcSousTotal,
  emptyLigne,
  formatDateFR,
  loadDevis,
  moisFromDate,
  moisLabel,
  moisOptions,
  nextDevisId,
  nextNumeroDevis,
  normalizeNumeroDevis,
  saveDevis,
  todayISO,
  totalDevis,
  type Devis,
  type TypeFacture,
  type TypeReglement,
} from "@/lib/devis";

const ligneSchema = z.object({
  kind: z.enum(["produit", "service"]).optional(),
  ref: z.string().optional(),
  designation: z.string().min(1, "Désignation obligatoire"),
  qte: z.string().min(1),
  unite: z.string().min(1),
  prixU: z.string().min(1),
  remise: z.string().min(1),
  tva: z.string().min(1),
  sousTotal: z.string(),
});

const schema = z.object({
  mois: z.string().min(1),
  date: z.string().min(1),
  typeFacture: z.enum(["Exonéré", "HT", "TTC"]),
  base: z.enum(["Devis"]),
  numeroDevis: z.string().min(1, "N° devis obligatoire"),
  id: z.string(), // interne DV-
  clientId: z.string().optional(),
  nomClient: z.string().min(1, "Nom client obligatoire"),
  ice: z.string().optional(),
  typeReglement: z.enum([
    "Esp",
    "Chq",
    "Vir",
    "Eff",
    "Vers",
    "Autre",
  ]),
  echeance: z.string().min(1),
  lignes: z.array(ligneSchema).min(1),
});

type FormValues = z.infer<typeof schema>;
type FormMode = "create" | "edit" | "view";

const selectClass =
  "flex h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-sm font-medium text-ink transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const inputShell =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 text-center shadow-none transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-0";

const inputReadonly =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-3 text-center font-medium text-slate-700 shadow-none focus-visible:ring-0";

/** Cellules tableau désignations */
const inputSheet =
  "h-9 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm shadow-none focus-visible:ring-1 focus-visible:ring-brand/30";

function num(v: string): number {
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function ligneToForm(l: ReturnType<typeof emptyLigne>) {
  return {
    kind: (inferCatalogKind(l.ref) as CatalogKind) || "produit",
    ref: l.ref,
    designation: l.designation,
    qte: String(l.qte),
    unite: l.unite,
    prixU: toMoneyInput(l.prixU),
    remise: toMoneyInput(l.remise),
    tva: toMoneyInput(l.tva),
    sousTotal: toMoneyInput(l.sousTotal),
  };
}

function toFormValues(f: Devis): FormValues {
  return {
    mois: f.mois,
    date: f.date,
    typeFacture: f.typeFacture,
    base: f.base,
    numeroDevis: f.numeroDevis,
    id: f.id,
    clientId: f.clientId,
    nomClient: f.nomClient,
    ice: f.ice,
    typeReglement: f.typeReglement,
    echeance: f.echeance,
    lignes: (f.lignes?.length ? f.lignes : [emptyLigne()]).map(ligneToForm),
  };
}

function onPrintDevis(d: Devis, withLetterhead: boolean) {
  const ok = printDevis(d, { withLetterhead });
  if (!ok) {
    toast.error("Impossible de lancer l'impression. Réessayez.");
  }
}

export default function DevisPage() {
  const router = useRouter();
  const [list, setList] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mode, setMode] = useState<FormMode | null>(null);
  const [ready, setReady] = useState(false);
  const [printTarget, setPrintTarget] = useState<Devis | null>(null);
  const moisOpts = useMemo(() => moisOptions(), []);
  const catalogItems = useMemo(
    () => buildCatalogSuggestItems(produits, services),
    [produits, services]
  );

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
      mois: moisFromDate(todayISO()),
      date: todayISO(),
      typeFacture: "TTC",
      base: "Devis",
      numeroDevis: "0001-Dev",
      id: "DV-0001",
      clientId: "",
      nomClient: "",
      ice: "",
      typeReglement: "Vir",
      echeance: todayISO(),
      lignes: [ligneToForm(emptyLigne())],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lignes" });
  const watchDate = useWatch({ control, name: "date" });
  const watchEcheance = useWatch({ control, name: "echeance" });
  const watchType = useWatch({ control, name: "typeFacture" });
  const watchLignes = useWatch({ control, name: "lignes" });

  const montantTotal = useMemo(() => {
    if (!watchLignes?.length) return 0;
    return watchLignes.reduce((s, l) => s + num(l.sousTotal), 0);
  }, [watchLignes]);

  useEffect(() => {
    const devis = loadDevis();
    setList(devis);
    setClients(loadClients());
    setProduits(loadProduits());
    setServices(loadServices());
    setReady(true);

    const onFocus = () => {
      setProduits(loadProduits());
      setServices(loadServices());
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("speedyprint:data-updated", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("speedyprint:data-updated", onFocus);
    };
  }, []);

  useEffect(() => {
    if (mode === "create" && watchDate) {
      setValue("mois", moisFromDate(watchDate));
    }
  }, [watchDate, mode, setValue]);

  // Recalc sous-totaux
  useEffect(() => {
    if (!watchLignes || !mode || mode === "view") return;
    const type = (watchType || "TTC") as TypeFacture;
    watchLignes.forEach((l, i) => {
      const st = calcSousTotal({
        qte: num(l.qte),
        prixU: num(l.prixU),
        remise: num(l.remise),
        tva: type === "Exonéré" ? 0 : num(l.tva),
        typeFacture: type,
      });
      const formatted = toMoneyInput(st);
      if (l.sousTotal !== formatted) {
        setValue(`lignes.${i}.sousTotal`, formatted, { shouldDirty: false });
      }
    });
  }, [watchLignes, watchType, mode, setValue]);

  const sorted = useMemo(
    () =>
      [...list].sort((a, b) => {
        if (a.date === b.date) return b.id.localeCompare(a.id);
        return b.date.localeCompare(a.date);
      }),
    [list]
  );

  const montantTotalListe = useMemo(
    () => list.reduce((s, f) => s + (Number(f.montantFacture) || 0), 0),
    [list]
  );

  const readOnly = mode === "view";

  function openNouveau() {
    const d = todayISO();
    const numero = nextNumeroDevis(list) || "0001-Dev";
    reset({
      mois: moisFromDate(d),
      date: d,
      typeFacture: "TTC",
      base: "Devis",
      numeroDevis: numero,
      id: nextDevisId(list),
      clientId: "",
      nomClient: "",
      ice: "",
      typeReglement: "Vir",
      echeance: d,
      lignes: [ligneToForm(emptyLigne())],
    });
    setMode("create");
  }

  function openView(f: Devis) {
    reset(toFormValues(f));
    setMode("view");
  }

  function openEdit(f: Devis) {
    reset(toFormValues(f));
    setMode("edit");
  }

  function closeForm() {
    setMode(null);
  }

  function linkClientByNom(nomSaisi: string) {
    if (readOnly) return;
    const key = normalizeNomClient(nomSaisi);
    if (!key) return;
    const match = clients.find((c) => normalizeNomClient(c.nom) === key);
    if (!match) return;
    setValue("clientId", match.id, { shouldValidate: true });
    setValue("nomClient", match.nom, { shouldValidate: true });
    if (match.ice) setValue("ice", match.ice);
    if (match.typeReglement) {
      setValue("typeReglement", match.typeReglement);
    }
  }

  function applyCatalogItem(index: number, item: CatalogSuggestItem) {
    if (readOnly) return;
    setValue(`lignes.${index}.kind`, item.kind, { shouldValidate: true });
    setValue(`lignes.${index}.ref`, item.ref, { shouldValidate: true });
    setValue(`lignes.${index}.designation`, item.designation, {
      shouldValidate: true,
    });
    setValue(`lignes.${index}.unite`, item.unite || "U", {
      shouldValidate: true,
    });
    setValue(`lignes.${index}.prixU`, toMoneyInput(item.prixVente), {
      shouldValidate: true,
    });
  }

  function onDelete(f: Devis) {
    const ok = window.confirm(
      `Supprimer le devis « ${f.numeroDevis} » ?`
    );
    if (!ok) return;
    const next = list.filter((x) => x.id !== f.id);
    setList(next);
    saveDevis(next);
    if (mode && getValues("id") === f.id) setMode(null);
    toast.success("Devis supprimé.");
  }

  function onConvert(d: Devis) {
    const factures = loadFacturesVente();
    if (isDevisConverted(d.id, factures)) {
      toast.error(`Le devis « ${d.numeroDevis} » est déjà converti en facture.`);
      return;
    }
    const ok = window.confirm(
      `Convertir le devis « ${d.numeroDevis} » en facture vente ?`
    );
    if (!ok) return;

    const facture = factureFromDevis(d, factures);
    const next = [facture, ...factures];
    saveFacturesVente(next);
    syncClientSoldeOnFactureCreate(facture);
    toast.success(
      `Devis converti en facture « ${facture.numeroFacture} ».`
    );
    router.push("/dashboard/clients/factures");
  }

  function onSubmit(values: FormValues) {
    if (mode === "view") return;

    const type = values.typeFacture as TypeFacture;
    const lignes = values.lignes.map((l) => {
      const qte = num(l.qte);
      const prixU = num(l.prixU);
      const remise = num(l.remise);
      const tva = type === "Exonéré" ? 0 : num(l.tva);
      const sousTotal = calcSousTotal({
        qte,
        prixU,
        remise,
        tva,
        typeFacture: type,
      });
      const kind = (l.kind || "produit") as CatalogKind;
      const ensured = ensureCatalogItem({
        kind,
        designation: l.designation,
        prixU,
        unite: l.unite,
        ref: l.ref,
      });
      return {
        ref: ensured.ref || (l.ref ?? "").trim(),
        designation: l.designation.trim(),
        qte,
        unite: l.unite,
        prixU,
        remise,
        tva,
        sousTotal,
      };
    });

    // Rafraîchir catalogue (réfs auto)
    setProduits(loadProduits());
    setServices(loadServices());

    const client = upsertClientFromDocument({
      clientId: values.clientId,
      nom: values.nomClient,
      ice: values.ice,
      typeReglement: values.typeReglement as TypeReglement,
      date: values.date,
    });
    setClients(loadClients());

    const row: Devis = {
      id: values.id || nextDevisId(list),
      mois: values.mois,
      date: values.date,
      typeFacture: type,
      base: values.base,
      numeroDevis: normalizeNumeroDevis(
        values.numeroDevis.trim() || nextNumeroDevis(list)
      ),
      clientId: client.id,
      nomClient: client.nom,
      ice: client.ice,
      typeReglement: values.typeReglement as TypeReglement,
      echeance: values.echeance,
      lignes,
      montantFacture: totalDevis(lignes),
    };

    if (mode === "create") {
      const next = [row, ...list];
      setList(next);
      saveDevis(next);
      toast.success("Devis enregistré.");
      setMode(null);
      return;
    }

    if (mode === "edit") {
      const next = list.map((f) => (f.id === row.id ? row : f));
      setList(next);
      saveDevis(next);
      toast.success("Devis modifié.");
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
    <>
    <div className="space-y-2 px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2">
      {!mode && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="stat-card-fixed relative min-w-[220px] flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] px-4 py-3.5 text-white shadow-md sm:max-w-[320px]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                  Montant Total
                </p>
                <p className="mt-1 text-xl font-extrabold tabular-nums tracking-tight">
                  {formatMoney(montantTotalListe)}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-white/75">
                  Total des devis
                </p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Receipt className="h-5 w-5" />
              </span>
            </div>
          </div>
          <Button type="button" onClick={openNouveau}>
            <Plus className="h-4 w-4" />
            Nouveau Devis
          </Button>
        </div>
      )}

      {mode && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/40 p-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] md:p-4"
        >
          <div className="flex flex-wrap gap-x-3 gap-y-3">
            <div className="min-w-[150px] flex-1">
              <Field label="Mois" error={errors.mois?.message}>
                <select
                  {...register("mois")}
                  className={selectClass}
                  disabled={readOnly}
                >
                  {moisOpts.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="min-w-[165px] flex-[0.9]">
              <Field label="Date" error={errors.date?.message}>
                <DateFrInput
                  value={watchDate}
                  onChange={(iso) => setValue("date", iso, { shouldValidate: true })}
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} min-w-[150px] px-2.5 text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[100px] flex-[0.55]">
              <Field label="N°" error={errors.numeroDevis?.message}>
                <Input
                  {...register("numeroDevis")}
                  placeholder="0001-Dev"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                  autoFocus={!readOnly}
                />
              </Field>
            </div>
            <div className="min-w-[110px] flex-[0.7]">
              <Field label="ID" error={errors.clientId?.message}>
                <Input
                  {...register("clientId")}
                  readOnly
                  className={`${inputReadonly} font-semibold text-brand`}
                  placeholder="Auto"
                />
              </Field>
            </div>
            <div className="min-w-[260px] flex-[2.4]">
              <Field
                label="Nom Client"
                error={errors.nomClient?.message}
              >
                <Input
                  {...register("nomClient")}
                  placeholder="Nom du client"
                  readOnly={readOnly}
                  className={readOnly ? inputReadonly : inputShell}
                  list="clients-existants-dv"
                  onBlur={(e) => linkClientByNom(e.target.value)}
                />
                <datalist id="clients-existants-dv">
                  {clients.map((c) => (
                    <option key={c.id} value={c.nom} />
                  ))}
                </datalist>
              </Field>
            </div>
            <div className="min-w-[140px] flex-1">
              <Field label="Type Règlement" error={errors.typeReglement?.message}>
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
            <div className="min-w-[165px] flex-[0.9]">
              <Field label="Échéance" error={errors.echeance?.message}>
                <DateFrInput
                  value={watchEcheance}
                  onChange={(iso) => setValue("echeance", iso, { shouldValidate: true })}
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} min-w-[150px] px-2.5 text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[130px] flex-1">
              <Field label="ICE" error={errors.ice?.message}>
                <Input
                  {...register("ice")}
                  placeholder="ICE"
                  readOnly={readOnly}
                  className={`${readOnly ? inputReadonly : inputShell} font-mono text-[13px]`}
                />
              </Field>
            </div>
          </div>

          <input type="hidden" {...register("id")} />
          <input type="hidden" {...register("typeFacture")} />
          <input type="hidden" {...register("base")} />

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/80 px-3 py-2.5">
              <p className="block w-full text-center text-[10px] font-bold uppercase tracking-[0.14em]">
                <span className="bg-gradient-to-r from-brand to-violet bg-clip-text text-transparent">
                  Désignations
                </span>
              </p>
              {!readOnly && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => append(ligneToForm(emptyLigne()))}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              )}
            </div>

            <div className="table-scroll">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-center text-[11px] font-bold uppercase tracking-wide text-white">
                    <th className="w-[96px] px-2 py-2.5">Réf</th>
                    <th className="min-w-[180px] px-2 py-2.5 text-left">
                      Désignation
                    </th>
                    <th className="w-[64px] px-2 py-2.5">Qté</th>
                    <th className="w-[72px] px-2 py-2.5">Unité</th>
                    <th className="w-[88px] px-2 py-2.5">Prix/U</th>
                    <th className="w-[68px] px-2 py-2.5">Remise</th>
                    <th className="w-[64px] px-2 py-2.5">TVA</th>
                    <th className="w-[100px] px-2 py-2.5">Sous-Total</th>
                    {!readOnly && <th className="w-[44px] px-1 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className="border-t border-slate-100 bg-white hover:bg-blue-50/30"
                    >
                      <td className="p-1.5 align-middle">
                        <CatalogSuggestInput
                          mode="ref"
                          value={watchLignes?.[index]?.ref ?? ""}
                          items={catalogItems}
                          readOnly={readOnly}
                          placeholder="Réf"
                          className={`${readOnly ? inputReadonly : inputSheet} text-center`}
                          onChange={(v) =>
                            setValue(`lignes.${index}.ref`, v, {
                              shouldValidate: true,
                            })
                          }
                          onSelect={(item) => applyCatalogItem(index, item)}
                        />
                      </td>
                      <td className="p-1.5 align-middle">
                        <CatalogSuggestInput
                          mode="designation"
                          value={watchLignes?.[index]?.designation ?? ""}
                          items={catalogItems}
                          readOnly={readOnly}
                          placeholder="Désignation"
                          className={`${readOnly ? inputReadonly : inputSheet} w-full text-left`}
                          onChange={(v) =>
                            setValue(`lignes.${index}.designation`, v, {
                              shouldValidate: true,
                            })
                          }
                          onSelect={(item) => applyCatalogItem(index, item)}
                        />
                        <input
                          type="hidden"
                          {...register(`lignes.${index}.kind`)}
                        />
                        {errors.lignes?.[index]?.designation && (
                          <p className="mt-0.5 text-[10px] text-rose-600">
                            {errors.lignes[index]?.designation?.message}
                          </p>
                        )}
                      </td>
                      <td className="p-1.5 align-middle">
                        <Input
                          {...register(`lignes.${index}.qte`)}
                          inputMode="decimal"
                          readOnly={readOnly}
                          className={`${readOnly ? inputReadonly : inputSheet} text-center`}
                        />
                      </td>
                      <td className="p-1.5 align-middle">
                        <Input
                          {...register(`lignes.${index}.unite`)}
                          readOnly={readOnly}
                          className={`${readOnly ? inputReadonly : inputSheet} text-center`}
                          placeholder="U"
                          list={`unites-dv-${index}`}
                        />
                        <datalist id={`unites-dv-${index}`}>
                          {UNITES.map((u) => (
                            <option key={u} value={u} />
                          ))}
                        </datalist>
                      </td>
                      <td className="p-1.5 align-middle">
                        <Input
                          {...register(`lignes.${index}.prixU`)}
                          inputMode="decimal"
                          readOnly={readOnly}
                          className={`${readOnly ? inputReadonly : inputSheet} text-center`}
                        />
                      </td>
                      <td className="p-1.5 align-middle">
                        <Input
                          {...register(`lignes.${index}.remise`)}
                          inputMode="decimal"
                          readOnly={readOnly}
                          className={`${readOnly ? inputReadonly : inputSheet} text-center`}
                          placeholder="%"
                        />
                      </td>
                      <td className="p-1.5 align-middle">
                        <Input
                          {...register(`lignes.${index}.tva`)}
                          inputMode="decimal"
                          readOnly={readOnly || watchType === "Exonéré"}
                          className={`${
                            readOnly || watchType === "Exonéré"
                              ? inputReadonly
                              : inputSheet
                          } text-center`}
                          placeholder="%"
                        />
                      </td>
                      <td className="p-1.5 align-middle">
                        <Input
                          {...register(`lignes.${index}.sousTotal`)}
                          readOnly
                          className={`${inputReadonly} font-bold tabular-nums`}
                        />
                      </td>
                      {!readOnly && (
                        <td className="p-1 align-middle text-center">
                          {fields.length > 1 ? (
                            <button
                              type="button"
                              title="Supprimer"
                              aria-label="Supprimer la désignation"
                              onClick={() => remove(index)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 transition hover:bg-rose-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <span className="inline-block h-8 w-8" />
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Total devis
                </span>
                <span className={`text-base ${moneyTone.facture}`}>
                  {formatMoney(montantTotal)}
                </span>
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="table-scroll">
          <table className="w-full min-w-[1100px] border-collapse text-center text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                <th className="px-3 py-3.5 text-[12px] font-bold">Mois</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Date</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">N°</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">ID</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Client</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Montant</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Règlement</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Échéance</th>
                <th className="px-3 py-3.5 text-[12px] font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center text-sm text-muted"
                  >
                    Aucun devis. Cliquez sur{" "}
                    <span className="font-semibold text-ink">
                      Nouveau Devis
                    </span>
                    .
                  </td>
                </tr>
              ) : (
                sorted.map((f, i) => (
                  <tr
                    key={f.id}
                    className={`border-t border-slate-100 hover:bg-blue-50/50 ${
                      i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    }`}
                  >
                    <td className="px-3 py-3 text-slate-600">
                      {moisLabel(f.mois)}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-slate-600">
                      {formatDateFR(f.date)}
                    </td>
                    <td className="px-3 py-3 font-semibold">{f.numeroDevis}</td>
                    <td className="px-3 py-3">
                      <span className="inline-flex rounded-lg bg-brand/10 px-2 py-0.5 text-xs font-bold text-brand">
                        {f.clientId}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-semibold">{f.nomClient}</td>
                    <td className={`px-3 py-3 ${moneyTone.facture}`}>
                      {formatMoney(f.montantFacture)}
                    </td>
                    <td className="px-3 py-3">{f.typeReglement}</td>
                    <td className="px-3 py-3 tabular-nums">
                      {formatDateFR(f.echeance)}
                    </td>
                    <td className="px-2 py-2">
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
                          onClick={() => setPrintTarget(f)}
                          className="text-slate-700 hover:bg-white"
                        >
                          <Printer className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn
                          label="Convertir"
                          onClick={() => onConvert(f)}
                          className="text-emerald-700 hover:bg-white"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
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
      )}
    </div>

      {printTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="print-devis-title"
          onClick={() => setPrintTarget(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
                <Printer className="h-4 w-4" />
              </span>
              <div>
                <h2
                  id="print-devis-title"
                  className="text-base font-bold text-ink"
                >
                  Impression devis
                </h2>
                <p className="text-xs text-muted">
                  {printTarget.numeroDevis} · {printTarget.nomClient}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Choisissez le format d&apos;impression :
            </p>

            <div className="mt-4 grid gap-2">
              <button
                type="button"
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left transition hover:border-brand/40 hover:bg-brand/5"
                onClick={() => {
                  const d = printTarget;
                  onPrintDevis(d, true);
                  setPrintTarget(null);
                }}
              >
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <span>
                  <span className="block text-sm font-bold text-ink">
                    Avec en-tête et pied de page
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Conception Speedy Print telle quelle
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left transition hover:border-brand/40 hover:bg-brand/5"
                onClick={() => {
                  const d = printTarget;
                  onPrintDevis(d, false);
                  setPrintTarget(null);
                }}
              >
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
                <span>
                  <span className="block text-sm font-bold text-ink">
                    Sans en-tête et pied de page
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Pour papier à en-tête déjà imprimé
                  </span>
                </span>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPrintTarget(null)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
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
