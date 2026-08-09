import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Permission } from "@/lib/permissions";
import type { UnifiedRole } from "@/services/auth.service";

export type RoleType = "student" | "teacher" | "parent" | "admin";
export type SessionStatus = "checking" | "authenticated" | "anonymous";
export type { UnifiedRole };

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Organization {
  id: string;
  name: string;
  code?: string;
  logo?: string;
}

interface Child {
  id: string;
  username: string;
  full_name?: string;
  avatar_url?: string;
  relationship: string;
}

interface ServerSessionState {
  user: AuthUser;
  roles: UnifiedRole[];
  activeRole: string | null;
  activeUnifiedRole: UnifiedRole | null;
  permissions: Permission[];
}

interface AuthState {
  user: AuthUser | null;
  sessionToken: string | null;

  roles: UnifiedRole[];
  activeRole: string | null;
  activeUnifiedRole: UnifiedRole | null;
  permissions: Permission[];

  organizations: Organization[];
  activeOrg: Organization | null;

  children: Child[];
  selectedChild: Child | null;

  sessionStatus: SessionStatus;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  registerRole: string | null;

  setUser: (user: AuthUser | null) => void;
  setAuthenticated: (value: boolean) => void;
  setSessionStatus: (status: SessionStatus) => void;
  setSessionToken: (token: string | null) => void;
  restoreSessionToken: () => string | null;
  applyServerSession: (session: ServerSessionState) => void;
  clearServerSession: () => void;
  setRoles: (roles: UnifiedRole[]) => void;
  setActiveRole: (role: string | null) => void;
  setActiveUnifiedRole: (role: UnifiedRole | null) => void;
  setPermissions: (permissions: Permission[]) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrg: (org: Organization | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChild: (child: Child | null) => void;
  setRegisterRole: (role: string | null) => void;
  setHasHydrated: (value: boolean) => void;

  /** @deprecated Tokens are managed by HTTP-only cookies. */
  setToken: (token: string | null) => void;

  login: (user: AuthUser, roles?: UnifiedRole[]) => void;
  logout: () => void;
  reset: () => void;
}

export const ROLE_SELECTION_TOKEN_KEY = "fortex-role-selection-token";

function readRoleSelectionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(ROLE_SELECTION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeRoleSelectionToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.sessionStorage.setItem(ROLE_SELECTION_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(ROLE_SELECTION_TOKEN_KEY);
    }
  } catch {
    // Storage can be unavailable in hardened/private browser modes.
  }
}

const initialState = {
  user: null,
  sessionToken: null,
  roles: [] as UnifiedRole[],
  activeRole: null,
  activeUnifiedRole: null,
  permissions: [] as Permission[],
  organizations: [] as Organization[],
  activeOrg: null,
  children: [] as Child[],
  selectedChild: null,
  sessionStatus: "checking" as SessionStatus,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  registerRole: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setAuthenticated: (isAuthenticated) =>
        set({
          isAuthenticated,
          sessionStatus: isAuthenticated ? "authenticated" : "anonymous",
        }),
      setSessionStatus: (sessionStatus) =>
        set({
          sessionStatus,
          isAuthenticated: sessionStatus === "authenticated",
        }),
      setSessionToken: (sessionToken) => {
        writeRoleSelectionToken(sessionToken);
        set(
          sessionToken
            ? {
                sessionToken,
                sessionStatus: "anonymous",
                isAuthenticated: false,
                permissions: [],
              }
            : { sessionToken }
        );
      },
      restoreSessionToken: () => {
        const sessionToken = readRoleSelectionToken();
        set({ sessionToken });
        return sessionToken;
      },
      applyServerSession: (session) => {
        const activeOrg = session.activeUnifiedRole?.organization_id
          ? {
              id: session.activeUnifiedRole.organization_id,
              name:
                session.activeUnifiedRole.organization_name ??
                session.activeUnifiedRole.organization_id,
            }
          : null;

        set({
          ...session,
          activeOrg,
          sessionStatus: "authenticated",
          isAuthenticated: true,
        });
      },
      clearServerSession: () => {
        writeRoleSelectionToken(null);
        set((state) => ({
          ...initialState,
          hasHydrated: state.hasHydrated,
          sessionStatus: "anonymous",
        }));
      },
      setRoles: (roles) => set({ roles }),
      setActiveRole: (activeRole) => set({ activeRole }),
      setActiveUnifiedRole: (activeUnifiedRole) => set({ activeUnifiedRole }),
      setPermissions: (permissions) => set({ permissions }),
      setOrganizations: (organizations) => set({ organizations }),
      setActiveOrg: (activeOrg) => set({ activeOrg }),
      setChildren: (children) => set({ children }),
      setSelectedChild: (selectedChild) => set({ selectedChild }),
      setRegisterRole: (registerRole) => set({ registerRole }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setToken: (token) => get().setSessionStatus(token ? "authenticated" : "anonymous"),

      // Login responses can still require role selection. Server bootstrap is what marks
      // the cookie-backed session authenticated.
      login: (user, roles) => set({ user, roles: roles || get().roles }),

      logout: () => get().clearServerSession(),
      reset: () => get().clearServerSession(),
    }),
    {
      name: "auth-storage",
      version: 2,
      migrate: (persistedState) => {
        const state = (persistedState ?? {}) as Partial<AuthState>;
        return {
          user: state.user ?? null,
          roles: state.roles ?? [],
          activeRole: state.activeRole ?? null,
          activeUnifiedRole: state.activeUnifiedRole ?? null,
          organizations: state.organizations ?? [],
          activeOrg: state.activeOrg ?? null,
          children: state.children ?? [],
          selectedChild: state.selectedChild ?? null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.restoreSessionToken();
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        roles: state.roles,
        activeRole: state.activeRole,
        activeUnifiedRole: state.activeUnifiedRole,
        organizations: state.organizations,
        activeOrg: state.activeOrg,
        children: state.children,
        selectedChild: state.selectedChild,
      }),
    }
  )
);
