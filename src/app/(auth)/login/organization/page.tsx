"use client";

import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SelectionCard } from "@/components/auth/selection-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { MOCK_ORGANIZATIONS } from "@/lib/mock-data";
import { useAuthStore } from "@/stores";

export default function LoginOrganizationPage() {
  const router = useRouter();
  const { selectedOrganization, setSelectedOrganization } = useAuthStore();

  const handleContinue = () => {
    if (!selectedOrganization) return;
    router.push(ROUTES.HOME);
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
        {MOCK_ORGANIZATIONS.map((org) => (
          <SelectionCard
            key={org.id}
            selected={selectedOrganization === org.id}
            onClick={() => setSelectedOrganization(org.id)}
            avatar={org.code.slice(0, 2)}
            title={org.name}
            subtitle={org.code}
          />
        ))}
      </div>

      <Button onClick={handleContinue} disabled={!selectedOrganization} className="mt-6 h-12 w-full">
        Tiếp tục
      </Button>
    </AuthCard>
  );
}
