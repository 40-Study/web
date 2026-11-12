"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { AUTH_ROLE_CHANGED_EVENT, type AuthRoleChangedDetail } from "@/lib/auth-events";
import { useSessionConnectionStore } from "@/lib/session-connection";
import { AUTH_SESSION_EXPIRED_EVENT, bootstrapAuthSession, retryBootstrapNow } from "./auth-session";
import { applyServerRoleChange } from "./auth-role-change";
import { SessionConnectionBanner } from "./session-connection-banner";

const retrySession = () => {
  void bootstrapAuthSession();
};

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

  // Hết lượt thử lại tự động mà mạng có lại → tự thử thêm một lần, không bắt người dùng tải lại trang.
  useEffect(() => {
    const onOnline = () => {
      if (useSessionConnectionStore.getState().state === "offline") retrySession();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  useEffect(() => {
    const onRoleChanged = (event: Event) => {
      const detail = (event as CustomEvent<AuthRoleChangedDetail>).detail;
      void applyServerRoleChange(detail?.activeRole ?? null);
    };
    window.addEventListener(AUTH_ROLE_CHANGED_EVENT, onRoleChanged);
    return () => window.removeEventListener(AUTH_ROLE_CHANGED_EVENT, onRoleChanged);
  }, []);

  return <SessionConnectionBanner onRetry={retrySession} onRetryNow={retryBootstrapNow} />;
}
