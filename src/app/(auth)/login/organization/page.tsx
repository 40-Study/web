"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SelectionCard } from "@/components/auth/selection-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores";
import { useSelectOrg } from "@/hooks/queries/use-auth";

export default function LoginOrganizationPage() {
  const router = useRouter();
  const { organizations, activeOrg, setActiveOrg } = useAuthStore();
  const selectOrg = useSelectOrg();
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(activeOrg?.id ?? null);

  const handleContinue = async () => {
    if (!selectedOrgId) return;
    
    try {
      await selectOrg.mutateAsync({ organization_id: selectedOrgId });
      const org = organizations.find((o) => o.id === selectedOrgId);
      if (org) {
        setActiveOrg({ id: org.id, name: org.name });
      }
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      console.error("Failed to select organization:", error);
    }
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Chọn tổ chức của bạn
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">
        Chọn tổ chức bạn muốn đăng nhập
      </p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn tổ chức">
        {organizations.length > 0 ? (
          organizations.map((org) => (
            <SelectionCard
              key={org.id}
              selected={selectedOrgId === org.id}
              onClick={() => setSelectedOrgId(org.id)}
              avatar={org.code?.slice(0, 2) || org.name.slice(0, 2)}
              title={org.name}
              subtitle={org.code || ""}
            />
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">
            Không tìm thấy tổ chức nào. Vui lòng đăng nhập lại.
          </p>
        )}
      </div>

      <Button 
        onClick={handleContinue} 
        disabled={!selectedOrgId || selectOrg.isPending} 
        className="mt-6 h-12 w-full"
      >
        {selectOrg.isPending ? "Đang xử lý..." : "Tiếp tục"}
      </Button>
    </AuthCard>
  );
}
