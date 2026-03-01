"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SelectionCard } from "@/components/auth/selection-card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";
import { MOCK_CHILDREN } from "@/lib/mock-data";

export default function LoginChildrenPage() {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = useState<string | null>(null);

  const handleContinue = () => {
    if (!selectedChild) return;
    router.push(ROUTES.HOME);
  };

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Xin chào, phụ huynh!
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn tài khoản con để tiếp tục</p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn tài khoản con">
        {MOCK_CHILDREN.map((child) => (
          <SelectionCard
            key={child.id}
            selected={selectedChild === child.id}
            onClick={() => setSelectedChild(child.id)}
            avatar={child.avatar}
            title={child.name}
            subtitle={child.grade}
            avatarClassName="rounded-full"
          />
        ))}
      </div>

      <Button onClick={handleContinue} disabled={!selectedChild} className="mt-6 h-12 w-full">
        Tiếp tục
      </Button>
    </AuthCard>
  );
}
