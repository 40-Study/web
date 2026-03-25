"use client";

import { RoleGuard } from "@/components/guards";
import { DOMAIN_ACCESS_POLICY } from "@/lib/domain-access-policy";

export default function LiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard roles={[...DOMAIN_ACCESS_POLICY.classroom]}>
      <div className="h-screen w-screen overflow-hidden bg-[#0e0e0e]">
        {children}
      </div>
    </RoleGuard>
  );
}
