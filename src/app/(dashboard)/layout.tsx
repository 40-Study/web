"use client";

import { RoleGuard } from "@/components/guards";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="min-h-screen bg-gray-50">
        {/* TODO: Add sidebar + header */}
        <main className="p-6">{children}</main>
      </div>
    </RoleGuard>
  );
}
