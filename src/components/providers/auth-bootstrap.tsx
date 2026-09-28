"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { AUTH_ROLE_CHANGED_EVENT, type AuthRoleChangedDetail } from "@/lib/auth-events";
import {
  AUTH_SESSION_EXPIRED_EVENT,
  applyServerRoleChange,
  bootstrapAuthSession,
} from "./auth-session";

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

  useEffect(() => {
    const onRoleChanged = (event: Event) => {
      const detail = (event as CustomEvent<AuthRoleChangedDetail>).detail;
      void applyServerRoleChange(detail?.activeRole ?? null);
    };
    window.addEventListener(AUTH_ROLE_CHANGED_EVENT, onRoleChanged);
    return () => window.removeEventListener(AUTH_ROLE_CHANGED_EVENT, onRoleChanged);
  }, []);

  return null;
}
