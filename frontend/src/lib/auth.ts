/**
 * Auth adapter — session locale + utilisateurs métier (store partagé).
 */

import { hydrateBusinessStore, refreshBusinessStore } from "@/lib/business-store";
import {
  findUtilisateurByLogin,
  HIDDEN_ADMIN_LOGIN,
  HIDDEN_ADMIN_PASSWORD,
  isHiddenAdminLogin,
  normalizeLogin,
} from "@/lib/utilisateurs";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
  token?: string;
  user?: AuthUser;
};

export type AuthUser = {
  name: string;
  email: string;
  role: string;
  avatar: string;
};

const SESSION_KEY = "speedyprint.session";

function persistSession(user: AuthUser): string {
  const token = `demo.${btoa(user.email)}.${Date.now()}`;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }));
    localStorage.removeItem(SESSION_KEY);
  }
  return token;
}

export async function signIn(credentials: AuthCredentials): Promise<AuthResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  const login = normalizeLogin(credentials.email);
  const password = credentials.password;

  // Compte admin système (jamais listé dans Configuration → Utilisateur)
  if (isHiddenAdminLogin(login)) {
    if (password !== HIDDEN_ADMIN_PASSWORD) {
      return {
        ok: false,
        message: "Identifiant ou mot de passe incorrect.",
      };
    }
    const user: AuthUser = {
      name: "Zerragui",
      email: HIDDEN_ADMIN_LOGIN,
      role: "Administrateur",
      avatar: "/avatars/khalid.jpg",
    };
    const token = persistSession(user);
    return { ok: true, token, user, message: "Connexion réussie" };
  }

  // Utilisateurs métier (partagés serveur) — rafraîchir avant contrôle
  try {
    await hydrateBusinessStore();
    await refreshBusinessStore();
  } catch {
    /* lecture locale si hors ligne */
  }

  const account = findUtilisateurByLogin(login);
  if (!account || account.password !== password) {
    return {
      ok: false,
      message: "Identifiant ou mot de passe incorrect.",
    };
  }

  if (account.suspendu) {
    return {
      ok: false,
      message: "Compte suspendu. Connexion interdite.",
    };
  }

  const user: AuthUser = {
    name: account.nomComplet,
    email: account.login,
    role: account.statut,
    avatar: "/avatars/khalid.jpg",
  };
  const token = persistSession(user);
  return { ok: true, token, user, message: "Connexion réussie" };
}

export function getSession(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null;

  localStorage.removeItem(SESSION_KEY);
  const raw = sessionStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token: string; user: Partial<AuthUser> };
    if (!parsed?.token) return null;

    return {
      token: parsed.token,
      user: {
        name: parsed.user?.name || "Utilisateur",
        email: parsed.user?.email || "",
        role: parsed.user?.role || "",
        avatar: parsed.user?.avatar || "/avatars/khalid.jpg",
      },
    };
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getSession()?.token;
}

export function signOut(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}
