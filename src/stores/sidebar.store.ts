import { create } from "zustand";
import { persist } from "zustand/middleware";

// Một API isCollapsed duy nhất dùng chung cho cả sidebar giáo viên và học sinh
// (trước đây có 2 API song song isCollapsed/isExpanded - mục 14). Sidebar học
// sinh (sidebar.tsx) tự suy ra isExpanded = !isCollapsed tại nơi dùng.
interface SidebarState {
    isCollapsed: boolean;
    toggle: () => void;
    setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            isCollapsed: false,
            toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
            setCollapsed: (isCollapsed) => set({ isCollapsed }),
        }),
        {
            name: "sidebar-storage",
        }
    )
);
