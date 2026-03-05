import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RoleType } from "@/components/auth/role-card";

interface User {
    email: string;
    name: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    selectedRole: RoleType | null;
    selectedOrganization: string | null;
    selectedChild: string | null;
    isAuthenticated: boolean;

    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    setSelectedRole: (role: RoleType | null) => void;
    setSelectedOrganization: (orgId: string | null) => void;
    setSelectedChild: (childId: string | null) => void;
    login: (user: User, token: string) => void;
    logout: () => void;
    reset: () => void;
}

const initialState = {
    user: null,
    token: null,
    selectedRole: null,
    selectedOrganization: null,
    selectedChild: null,
    isAuthenticated: false,
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            ...initialState,

            setUser: (user) => set({ user }),
            setToken: (token) => set({ token }),
            setSelectedRole: (selectedRole) => set({ selectedRole }),
            setSelectedOrganization: (selectedOrganization) =>
                set({ selectedOrganization }),
            setSelectedChild: (selectedChild) => set({ selectedChild }),

            login: (user, token) =>
                set({ user, token, isAuthenticated: true }),

            logout: () => set({ ...initialState }),

            reset: () => set({ ...initialState }),
        }),
        {
            name: "auth-storage",
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                selectedRole: state.selectedRole,
                selectedOrganization: state.selectedOrganization,
                selectedChild: state.selectedChild,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
