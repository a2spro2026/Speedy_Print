import {
  TYPES_REGLEMENT,
  normalizeTypeReglement,
  type TypeReglement,
} from "@/lib/fournisseurs";

export type ReglementFournisseur = {
  id: string; // REG-xxxx
  date: string; // YYYY-MM-DD
  factureId: string; // FA-xxxx interne
  refFacture: string; // N° facture affiché
  fournisseurId: string;
  nomFournisseur: string;
  montantFacture: number;
  montantPaye: number;
  solde: number;
  modeReglement: TypeReglement;
  numeroRegl: string;
  bnqRegl: string;
  nomTire: string;
  dateDecaisse: string; // YYYY-MM-DD
  statut: "Oui" | "Non";
};

const STORAGE_KEY = "speedyprint.reglements-fournisseur";

export { TYPES_REGLEMENT };

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatDateFR(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function padId(n: number): string {
  return `REG-${String(n).padStart(4, "0")}`;
}

export function nextReglementId(existing: ReglementFournisseur[]): string {
  let max = 0;
  for (const r of existing) {
    const m = /^REG-(\d+)$/.exec(r.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calcSolde(montantFacture: number, montantPaye: number): number {
  return round2(montantFacture - montantPaye);
}

type Legacy = Partial<ReglementFournisseur> & {
  modePaiement?: TypeReglement;
  dateDecai?: string;
};

export function loadReglements(): ReglementFournisseur[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Legacy[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => {
      const montantFacture = Number(r.montantFacture) || 0;
      const montantPaye =
        r.montantPaye != null ? Number(r.montantPaye) || 0 : montantFacture;
      const solde =
        r.solde != null
          ? Number(r.solde) || 0
          : calcSolde(montantFacture, montantPaye);
      return {
        id: r.id || "",
        date: r.date || todayISO(),
        factureId: r.factureId || "",
        refFacture: r.refFacture || "",
        fournisseurId: r.fournisseurId || "",
        nomFournisseur: r.nomFournisseur || "",
        montantFacture,
        montantPaye,
        solde,
        modeReglement: normalizeTypeReglement(
          r.modeReglement || r.modePaiement || "Vir"
        ),
        numeroRegl: r.numeroRegl || "",
        bnqRegl: r.bnqRegl || "",
        nomTire: r.nomTire || "",
        dateDecaisse: r.dateDecaisse || r.dateDecai || todayISO(),
        statut: r.statut === "Oui" || r.statut === "Non" ? r.statut : "Non",
      };
    });
  } catch {
    return [];
  }
}

export function saveReglements(list: ReglementFournisseur[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}
