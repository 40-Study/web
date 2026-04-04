import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Permission } from "@/lib/permissions";
import type { UnifiedRole } from "@/services/auth.service";

export type RoleType = "student" | "teacher" | "parent" | "admin";
export type { UnifiedRole };

interface User {
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
  name: string;
  avatar?: string;
}

interface AuthState {
  // User data
  user: User | null;
  token: string | null;
  sessionToken: string | null;

  // Multi-role system (unified roles from backend)
  roles: UnifiedRole[];
  activeRole: string | null;
  permissions: Permission[];

  // Organization context
  organizations: Organization[];
  activeOrg: Organization | null;

  // Parent-child relationship
  children: Child[];
  selectedChild: Child | null;

  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  // Registration ephemeral state
  registerRole: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setSessionToken: (token: string | null) => void;
  setRoles: (roles: UnifiedRole[]) => void;
  setActiveRole: (role: string | null) => void;
  setPermissions: (permissions: Permission[]) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrg: (org: Organization | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChild: (child: Child | null) => void;
  setRegisterRole: (role: string | null) => void;
  setHasHydrated: (value: boolean) => void;

  login: (user: User, roles?: UnifiedRole[]) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  token: null,
  sessionToken: null,
  roles: [],
  activeRole: null,
  permissions: [],
  organizations: [],
  activeOrg: null,
  children: [],
  selectedChild: null,
  isAuthenticated: false,
  isLoading: false,
  hasHydrated: false,
  registerRole: null,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setSessionToken: (sessionToken) => set({ sessionToken }),
      setRoles: (roles) => set({ roles }),
      setActiveRole: (activeRole) => set({ activeRole }),
      setPermissions: (permissions) => set({ permissions }),
      setOrganizations: (organizations) => set({ organizations }),
      setActiveOrg: (activeOrg) => set({ activeOrg }),
      setChildren: (children) => set({ children }),
      setSelectedChild: (selectedChild) => set({ selectedChild }),
      setRegisterRole: (registerRole) => set({ registerRole }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      login: (user, roles = []) =>
        set({
          user,
          roles,
          isAuthenticated: true,
        }),

      logout: () => set({ ...initialState }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        roles: state.roles,
        activeRole: state.activeRole,
        permissions: state.permissions,
        organizations: state.organizations,
        activeOrg: state.activeOrg,
        children: state.children,
        selectedChild: state.selectedChild,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
