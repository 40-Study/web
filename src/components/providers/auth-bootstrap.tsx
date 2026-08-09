"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { AUTH_SESSION_EXPIRED_EVENT, bootstrapAuthSession } from "./auth-session";

export function AuthBootstrap() {
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const started = useRef(false);

  useEffect(() => {
    if (!hasHydrated || started.current) return;
    started.current = true;
    void bootstrapAuthSession();
  }, [hasHydrated]);

  useEffect(() => {
    const revalidateSession = () => {
      void bootstrapAuthSession();
    };
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, revalidateSession);
    return () => window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, revalidateSession);
  }, []);

  return null;
}
