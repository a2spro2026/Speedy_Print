"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, type AuthUser } from "@/lib/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/");
      return;
    }
    setUser(session.user);
    setReady(true);
  }, [router]);

  return { user, ready };
}
