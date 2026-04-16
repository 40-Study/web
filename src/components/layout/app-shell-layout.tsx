"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { useSidebarStore } from "@/stores/sidebar.store";
import { cn } from "@/lib/utils";

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  const { isExpanded } = useSidebarStore();

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Header />
      <div className="flex flex-1 pt-16 min-h-0">
        <Sidebar />
        <div className={cn(
          "flex-1 w-full flex flex-col overflow-x-hidden min-h-[calc(100vh-4rem)] transition-all duration-200",
          isExpanded ? "lg:pl-48" : "lg:pl-[60px]",
        )}>
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
