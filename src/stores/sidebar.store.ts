import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
    isCollapsed: boolean;
    isExpanded: boolean; // student sidebar expanded state
    toggle: () => void;
    setCollapsed: (collapsed: boolean) => void;
    toggleExpanded: () => void;
    setExpanded: (expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            isExpanded: false,
            toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            setCollapsed: (isCollapsed) => set({ isCollapsed }),
            toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
            setExpanded: (isExpanded) => set({ isExpanded }),
        }),
        {
            name: "sidebar-storage",
        }
    )
);
