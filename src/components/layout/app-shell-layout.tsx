"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col">
      <Header />
      {/* pt-16 accounts for fixed header height */}
      <div className="flex flex-1 pt-16 min-h-0">
        <Sidebar />
        {/* lg:pl-16 pulls content slightly closer to sidebar (sidebar is w-16 = 64px) */}
        <div className="flex-1 w-full lg:pl-16 flex flex-col overflow-x-hidden min-h-[calc(100vh-4rem)]">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
