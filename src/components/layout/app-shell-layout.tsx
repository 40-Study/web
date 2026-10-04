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
  const { activeRole, isAuthenticated } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const isAdminRole = normalizedRole === "SYSTEM_ADMIN" || normalizedRole === "ORG_OWNER";
  // Học sinh, phụ huynh, khách VÀ admin (A-P2-4: admin ghé vài trang tài khoản
  // cá nhân qua layout này) dùng chung AppShellLayout — chọn đúng bộ tab cho
  // BottomNav (M-19 + QA guest P1: khách chưa đăng nhập trước đây rơi vào bộ
  // tab "student", 3/5 mục dẫn thẳng vào tường đăng nhập).
  const bottomNavRole = !isAuthenticated
    ? "guest"
    : isAdminRole
      ? "admin"
      : normalizedRole === "PARENT"
        ? "parent"
        : normalizedRole === "TEACHER"
          ? "teacher" // B-11: giảng viên ghé trang dùng chung vẫn thấy tab giảng viên
          : "student";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 pt-16 min-h-0">
        <Sidebar />
        <div className={cn(
          "flex-1 w-full flex flex-col overflow-x-hidden min-h-[calc(100vh-4rem)] transition-all duration-200",
          isExpanded ? "lg:pl-48" : "lg:pl-[60px]",
        )}>
          {/* id="main-content": đích của skip link trong layout.tsx (H-04) */}
          <main id="main-content" className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
          <Footer />
          <BottomNav role={bottomNavRole} />
        </div>
      </div>
    </div>
  );
}
