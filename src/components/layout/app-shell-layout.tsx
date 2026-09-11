"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";
import { useSidebarStore } from "@/stores/sidebar.store";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const { isCollapsed } = useSidebarStore();
  const isExpanded = !isCollapsed; // sidebar.store.ts dùng chung 1 API isCollapsed (mục 14)
  const { activeRole } = useAuthStore();
  // Học sinh và phụ huynh dùng chung AppShellLayout — chọn đúng bộ tab cho BottomNav (M-19).
  const bottomNavRole = normalizeRole(activeRole) === "PARENT" ? "parent" : "student";

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Header />
      <div className="flex flex-1 pt-16 min-h-0">
        <Sidebar />
        <div className={cn(
          "flex-1 w-full flex flex-col overflow-x-hidden min-h-[calc(100vh-4rem)] transition-all duration-200",
          isExpanded ? "lg:pl-48" : "lg:pl-[60px]",
        )}>
          {/* id="main-content": đích của skip link trong layout.tsx (H-04) */}
          <main id="main-content" className="flex-1 pb-24 lg:pb-0">{children}</main>
          <Footer />
          <BottomNav role={bottomNavRole} />
        </div>
      </div>
    </div>
  );
}
