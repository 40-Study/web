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
  username: string;
  full_name?: string;
  avatar_url?: string;
  relationship: string;
}

interface AuthState {
  // User data (token do cookies quản lý, không lưu ở đây)
  user: User | null;
  sessionToken: string | null; // Tạm thời cho multi-role login flow

  // Multi-role system
  roles: UnifiedRole[];
  activeRole: string | null;
  activeUnifiedRole: UnifiedRole | null;
  permissions: Permission[];

  // Organization context
  organizations: Organization[];
  activeOrg: Organization | null;

  // Parent-child
  children: Child[];
  selectedChild: Child | null;

  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;

  // Registration ephemeral
  registerRole: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setSessionToken: (token: string | null) => void;
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

  /** @deprecated dùng setAuthenticated thay — token do cookies quản lý */
  setToken: (token: string | null) => void;

  login: (user: User, roles?: UnifiedRole[]) => void;
  logout: () => void;
  reset: () => void;
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
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setSessionToken: (sessionToken) => set({ sessionToken }),
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

      // Compat: code cũ gọi setToken — giờ chỉ set isAuthenticated
      setToken: (token) => set({ isAuthenticated: !!token }),

      login: (user, roles) =>
        set({
          user,
          roles: roles || [],
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
        roles: state.roles,
        activeRole: state.activeRole,
        activeUnifiedRole: state.activeUnifiedRole,
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
