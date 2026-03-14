import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Permission } from "@/lib/permissions";

export type RoleType = "student" | "teacher" | "parent" | "admin";

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

  // Multi-role system
  systemRoles: string[];
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

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setSystemRoles: (roles: string[]) => void;
  setActiveRole: (role: string | null) => void;
  setPermissions: (permissions: Permission[]) => void;
  setOrganizations: (orgs: Organization[]) => void;
  setActiveOrg: (org: Organization | null) => void;
  setChildren: (children: Child[]) => void;
  setSelectedChild: (child: Child | null) => void;

  login: (user: User, token: string, roles?: string[]) => void;
  logout: () => void;
  reset: () => void;
}

const initialState = {
  user: null,
  token: null,
  systemRoles: [],
  activeRole: null,
  permissions: [],
  organizations: [],
  activeOrg: null,
  children: [],
  selectedChild: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setSystemRoles: (systemRoles) => set({ systemRoles }),
      setActiveRole: (activeRole) => set({ activeRole }),
      setPermissions: (permissions) => set({ permissions }),
      setOrganizations: (organizations) => set({ organizations }),
      setActiveOrg: (activeOrg) => set({ activeOrg }),
      setChildren: (children) => set({ children }),
      setSelectedChild: (selectedChild) => set({ selectedChild }),

      login: (user, token, roles = []) =>
        set({
          user,
          token,
          systemRoles: roles,
          isAuthenticated: true,
        }),

      logout: () => set({ ...initialState }),
      reset: () => set({ ...initialState }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        systemRoles: state.systemRoles,
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
