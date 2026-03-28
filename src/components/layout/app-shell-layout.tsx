"use client";

import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header />
      <div className="flex flex-1 pt-16">
        <Sidebar />
        <div className="flex-1 w-full lg:pl-20 flex flex-col overflow-x-hidden">
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
