"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, CheckCircle2, Pencil, Plus, UserCog, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DateFrInput } from "@/components/ui/date-fr-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateFR, todayISO } from "@/lib/clients";
import { refreshBusinessStore } from "@/lib/business-store";
import {
  isHiddenAdminLogin,
  listVisibleUtilisateurs,
  loginExists,
  nextUtilisateurId,
  saveUtilisateurs,
  STATUTS_UTILISATEUR,
  type StatutUtilisateur,
  type Utilisateur,
} from "@/lib/utilisateurs";

const schema = z.object({
  date: z.string().min(1),
  id: z.string().min(1),
  nomComplet: z.string().min(1, "Nom complet obligatoire"),
  statut: z.enum(["Gérant", "Assistante", "Facturation", "Technicien"]),
  login: z.string().min(1, "Login obligatoire"),
  password: z
    .string()
    .min(1, "Mot de passe obligatoire")
    .min(6, "Au moins 6 caractères"),
});

type FormValues = z.infer<typeof schema>;
type FormMode = "create" | "edit";

const selectClass =
  "flex h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-sm font-medium text-ink transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-60";

const inputShell =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200 bg-slate-50/80 px-3 text-center shadow-none transition-all duration-200 hover:bg-slate-50 focus-visible:border-brand focus-visible:bg-white focus-visible:ring-0";

const inputReadonly =
  "h-10 w-full rounded-lg border-0 border-b-2 border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-3 text-center font-medium text-slate-700 shadow-none focus-visible:ring-0";

function toFormValues(u: Utilisateur): FormValues {
  return {
    date: u.date,
    id: u.id,
    nomComplet: u.nomComplet,
    statut: u.statut,
    login: u.login,
    password: u.password,
  };
}

function statutBadgeClass(statut: StatutUtilisateur): string {
  switch (statut) {
    case "Gérant":
      return "bg-violet-100 text-violet-800";
    case "Assistante":
      return "bg-sky-100 text-sky-800";
    case "Facturation":
      return "bg-amber-100 text-amber-800";
    case "Technicien":
      return "bg-emerald-100 text-emerald-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function UtilisateursPage() {
  const router = useRouter();
  const [list, setList] = useState<Utilisateur[]>([]);
  const [mode, setMode] = useState<FormMode | null>(null);
  const [ready, setReady] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: todayISO(),
      id: "USR-0001",
      nomComplet: "",
      statut: "Assistante",
      login: "",
      password: "",
    },
  });

  const watchDate = useWatch({ control, name: "date" });

  useEffect(() => {
    void (async () => {
      await refreshBusinessStore();
      setList(listVisibleUtilisateurs());
      setReady(true);
    })();
  }, []);

  const sorted = useMemo(
    () =>
      [...list].sort((a, b) => {
        if (a.date === b.date) return b.id.localeCompare(a.id);
        return b.date.localeCompare(a.date);
      }),
    [list]
  );

  function openAjouter() {
    reset({
      date: todayISO(),
      id: nextUtilisateurId(list),
      nomComplet: "",
      statut: "Assistante",
      login: "",
      password: "",
    });
    setMode("create");
  }

  function openEdit(u: Utilisateur) {
    reset(toFormValues(u));
    setMode("edit");
  }

  function closeForm() {
    setMode(null);
  }

  function onSubmit(values: FormValues) {
    const nomComplet = values.nomComplet.trim();
    const login = values.login.trim().toLowerCase();
    const password = values.password;

    if (isHiddenAdminLogin(login)) {
      toast.error("Ce login est réservé au système.");
      return;
    }

    if (loginExists(login, mode === "edit" ? values.id : undefined)) {
      toast.error("Ce login existe déjà.");
      return;
    }

    if (mode === "create") {
      const row: Utilisateur = {
        id: values.id,
        date: values.date,
        nomComplet,
        statut: values.statut,
        login,
        password,
        suspendu: false,
      };
      const next = [row, ...list];
      setList(next);
      saveUtilisateurs(next);
      toast.success("Utilisateur ajouté.");
      setMode(null);
      return;
    }

    if (mode === "edit") {
      const prev = list.find((u) => u.id === values.id);
      if (!prev) {
        toast.error("Utilisateur introuvable.");
        return;
      }
      const row: Utilisateur = {
        ...prev,
        date: values.date,
        nomComplet,
        statut: values.statut,
        login,
        password,
      };
      const next = list.map((u) => (u.id === row.id ? row : u));
      setList(next);
      saveUtilisateurs(next);
      toast.success("Utilisateur modifié.");
      setMode(null);
    }
  }

  function toggleSuspend(u: Utilisateur) {
    const next = list.map((row) =>
      row.id === u.id ? { ...row, suspendu: !row.suspendu } : row
    );
    setList(next);
    saveUtilisateurs(next);
    toast.success(
      u.suspendu ? "Compte réactivé." : "Compte suspendu — connexion interdite."
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
    <div className="space-y-2 px-4 pb-4 pt-1 md:px-6 md:pb-6 md:pt-2">
      {!mode && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted">
            <UserCog className="h-4 w-4 text-brand" />
            <span>Gestion des comptes (hors admin système)</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={openAjouter}>
              <Plus className="h-4 w-4" />
              Ajouter
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
        </div>
      )}

      {mode && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200/70 bg-gradient-to-b from-white via-white to-slate-50/40 p-3 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.25)] md:p-4"
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">
              {mode === "create" ? "Nouvel utilisateur" : "Modifier utilisateur"}
            </h2>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-3">
            <div className="min-w-[128px] flex-[0.55]">
              <Field label="Date" error={errors.date?.message}>
                <DateFrInput
                  value={watchDate}
                  onChange={(iso) =>
                    setValue("date", iso, { shouldValidate: true })
                  }
                  className={`${inputShell} px-1.5 text-[13px]`}
                />
              </Field>
            </div>
            <div className="min-w-[120px] flex-[0.7]">
              <Field label="ID" error={errors.id?.message}>
                <Input
                  {...register("id")}
                  readOnly
                  className={`${inputReadonly} font-semibold text-brand`}
                />
              </Field>
            </div>
            <div className="min-w-[200px] flex-[1.4]">
              <Field label="Nom Complet" error={errors.nomComplet?.message}>
                <Input
                  {...register("nomComplet")}
                  placeholder="Nom et prénom"
                  className={inputShell}
                  autoComplete="off"
                />
              </Field>
            </div>
            <div className="min-w-[160px] flex-[1]">
              <Field label="Statut" error={errors.statut?.message}>
                <select {...register("statut")} className={selectClass}>
                  <option value="" disabled>
                    — Sélectionner —
                  </option>
                  {STATUTS_UTILISATEUR.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="min-w-[140px] flex-[1]">
              <Field label="Login" error={errors.login?.message}>
                <Input
                  {...register("login")}
                  placeholder="identifiant"
                  className={inputShell}
                  autoComplete="off"
                  data-lpignore="true"
                  data-1p-ignore
                />
              </Field>
            </div>
            <div className="min-w-[140px] flex-[1]">
              <Field label="Mot de passe" error={errors.password?.message}>
                <Input
                  {...register("password")}
                  type="text"
                  placeholder="••••••••"
                  className={inputShell}
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-1p-ignore
                />
              </Field>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2 border-t border-slate-100/80 pt-3">
            <Button type="button" variant="outline" onClick={closeForm}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Valider
            </Button>
          </div>
        </form>
      )}

      {!mode && (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="table-scroll">
            <table className="w-full min-w-[980px] border-collapse text-center text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
                  <th className="px-3 py-3.5 text-[12px] font-bold">Date</th>
                  <th className="px-3 py-3.5 text-[12px] font-bold">ID</th>
                  <th className="px-3 py-3.5 text-[12px] font-bold">
                    Nom Complet
                  </th>
                  <th className="px-3 py-3.5 text-[12px] font-bold">Statut</th>
                  <th className="px-3 py-3.5 text-[12px] font-bold">Login</th>
                  <th className="px-3 py-3.5 text-[12px] font-bold">
                    Mot de passe
                  </th>
                  <th className="px-3 py-3.5 text-[12px] font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-14 text-center text-sm text-muted"
                    >
                      Aucun utilisateur. Cliquez sur{" "}
                      <span className="font-semibold text-ink">Ajouter</span>.
                    </td>
                  </tr>
                ) : (
                  sorted.map((u, i) => (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-100 ${
                        u.suspendu
                          ? "bg-rose-50/50 opacity-80"
                          : i % 2 === 0
                            ? "bg-white"
                            : "bg-slate-50/60"
                      }`}
                    >
                      <td className="px-3 py-2.5 tabular-nums text-slate-600">
                        {formatDateFR(u.date)}
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-brand">
                        {u.id}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-ink">
                        {u.nomComplet}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-0.5 text-xs font-bold ${statutBadgeClass(u.statut)}`}
                          >
                            {u.statut}
                          </span>
                          {u.suspendu ? (
                            <span className="text-[11px] font-bold uppercase tracking-wide text-rose-600">
                              Suspendu
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[13px]">
                        {u.login}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[13px]">
                        {u.password}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <ActionBtn
                            label="Modifier"
                            onClick={() => openEdit(u)}
                            className="text-amber-700 hover:bg-white"
                          >
                            <Pencil className="h-4 w-4" />
                          </ActionBtn>
                          <ActionBtn
                            label={u.suspendu ? "Réactiver" : "Suspendre"}
                            onClick={() => toggleSuspend(u)}
                            className={
                              u.suspendu
                                ? "text-emerald-700 hover:bg-white"
                                : "text-rose-700 hover:bg-white"
                            }
                          >
                            {u.suspendu ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
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
