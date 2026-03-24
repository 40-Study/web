"use client";

import { RoleGuard } from "@/components/guards";
import { DOMAIN_ACCESS_POLICY } from "@/lib/domain-access-policy";

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard roles={[...DOMAIN_ACCESS_POLICY.classroom]}>
      <div className="h-screen overflow-hidden bg-gray-900">
        {children}
      </div>
    </RoleGuard>
  );
}
