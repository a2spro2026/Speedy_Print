import { readJsonStore, writeJsonStore } from "@/lib/business-store";
import { todayISO } from "@/lib/clients";

export type StatutUtilisateur =
  | "Gérant"
  | "Assistante"
  | "Facturation"
  | "Technicien";

export type Utilisateur = {
  id: string;
  date: string; // YYYY-MM-DD
  nomComplet: string;
  statut: StatutUtilisateur;
  login: string;
  password: string;
  /** true = connexion interdite */
  suspendu: boolean;
};

const STORAGE_KEY = "speedyprint.utilisateurs";

/** Compte admin système : jamais listé, jamais créable depuis l'UI. */
export const HIDDEN_ADMIN_LOGIN = "zerragui";
export const HIDDEN_ADMIN_PASSWORD = "0661755048";

export const STATUTS_UTILISATEUR: StatutUtilisateur[] = [
  "Gérant",
  "Assistante",
  "Facturation",
  "Technicien",
];

export function normalizeLogin(login: string): string {
  return login.trim().toLowerCase();
}

export function isHiddenAdminLogin(login: string): boolean {
  return normalizeLogin(login) === HIDDEN_ADMIN_LOGIN;
}

function padId(n: number): string {
  return `USR-${String(n).padStart(4, "0")}`;
}

export function nextUtilisateurId(existing: Utilisateur[]): string {
  let max = 0;
  for (const u of existing) {
    const m = /^USR-(\d+)$/.exec(u.id);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return padId(max + 1);
}

function normalizeStatut(value: unknown): StatutUtilisateur {
  if (
    value === "Gérant" ||
    value === "Assistante" ||
    value === "Facturation" ||
    value === "Technicien"
  ) {
    return value;
  }
  return "Assistante";
}

function normalizeRow(raw: Partial<Utilisateur>): Utilisateur | null {
  const id = String(raw.id ?? "").trim();
  const login = normalizeLogin(String(raw.login ?? ""));
  const nomComplet = String(raw.nomComplet ?? "").trim();
  const password = String(raw.password ?? "");
  if (!id || !login || !nomComplet) return null;
  return {
    id,
    date: String(raw.date ?? todayISO()).slice(0, 10),
    nomComplet,
    statut: normalizeStatut(raw.statut),
    login,
    password,
    suspendu: Boolean(raw.suspendu),
  };
}

export function loadUtilisateurs(): Utilisateur[] {
  const raw = readJsonStore<unknown>(STORAGE_KEY, []);
  if (!Array.isArray(raw)) return [];
  const out: Utilisateur[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = normalizeRow(item as Partial<Utilisateur>);
    if (!row) continue;
    // Ne jamais persister le compte admin dans la liste métier
    if (isHiddenAdminLogin(row.login)) continue;
    out.push(row);
  }
  return out;
}

export function saveUtilisateurs(list: Utilisateur[]): void {
  const cleaned = list
    .map((u) => normalizeRow(u))
    .filter((u): u is Utilisateur => !!u && !isHiddenAdminLogin(u.login));
  writeJsonStore(STORAGE_KEY, cleaned);
}

/** Liste affichée (sans le compte admin masqué). */
export function listVisibleUtilisateurs(): Utilisateur[] {
  return loadUtilisateurs();
}

export function findUtilisateurByLogin(login: string): Utilisateur | null {
  const key = normalizeLogin(login);
  if (!key || isHiddenAdminLogin(key)) return null;
  return loadUtilisateurs().find((u) => u.login === key) ?? null;
}

export function loginExists(
  login: string,
  exceptId?: string
): boolean {
  const key = normalizeLogin(login);
  if (!key) return false;
  if (isHiddenAdminLogin(key)) return true;
  return loadUtilisateurs().some(
    (u) => u.login === key && (!exceptId || u.id !== exceptId)
  );
}
