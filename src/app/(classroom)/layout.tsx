"use client";

import { RoleGuard } from "@/components/guards";

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard>
      <div className="h-screen overflow-hidden bg-gray-900">
        {children}
      </div>
    </RoleGuard>
  );
}
