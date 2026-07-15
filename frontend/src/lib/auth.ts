/**
 * Auth adapter — session locale pour la démo.
 * Remplacer facilement par JWT / Supabase Auth.
 */

export type AuthCredentials = {
  email: string;
  password: string;
  remember?: boolean;
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
const REMEMBER_KEY = "speedyprint.remember";

export async function signIn(credentials: AuthCredentials): Promise<AuthResult> {
  await new Promise((resolve) => setTimeout(resolve, 800));

  const email = credentials.email.trim().toLowerCase();
  const password = credentials.password;

  // Compte démo + accès admin Laravel (mêmes identifiants)
  const valid =
    (email === "admin@speedyprint.fr" && password === "password") ||
    (email === "admin@speedyprint.fr" && password === "admin");

  if (!valid) {
    return {
      ok: false,
      message: "Email ou mot de passe incorrect. Essayez admin@speedyprint.fr / password",
    };
  }

  const user: AuthUser = {
    name: "MR KAHLID",
    email: "admin@speedyprint.fr",
    role: "Administrateur",
    avatar: "/avatars/khalid.jpg",
  };

  const token = `demo.${btoa(user.email)}.${Date.now()}`;

  if (typeof window !== "undefined") {
    const payload = JSON.stringify({ token, user });
    if (credentials.remember) {
      localStorage.setItem(REMEMBER_KEY, credentials.email);
      localStorage.setItem(SESSION_KEY, payload);
    } else {
      localStorage.removeItem(REMEMBER_KEY);
      sessionStorage.setItem(SESSION_KEY, payload);
      localStorage.removeItem(SESSION_KEY);
    }
  }

  return {
    ok: true,
    token,
    user,
    message: "Connexion réussie",
  };
}

export function getSession(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null;

  const raw =
    localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as { token: string; user: Partial<AuthUser> };
    if (!parsed?.token) return null;

    return {
      token: parsed.token,
      user: {
        name: parsed.user?.name || "MR KAHLID",
        email: parsed.user?.email || "admin@speedyprint.fr",
        role: parsed.user?.role || "Administrateur",
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
