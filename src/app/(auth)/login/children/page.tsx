"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { SelectionCard } from "@/components/auth/selection-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/routes";
import { useAuthStore } from "@/stores";
import { useChildren } from "@/hooks/queries/use-auth";

export default function LoginChildrenPage() {
  const router = useRouter();
  const { selectedChild, setSelectedChild } = useAuthStore();
  const { data: childrenData, isLoading, error } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(
    selectedChild?.id ?? null
  );

  const children = childrenData?.children ?? [];

  const handleContinue = () => {
    if (!selectedChildId) return;
    const child = children.find((c) => c.id === selectedChildId);
    if (child) {
      setSelectedChild({ id: child.id, name: child.name, avatar: child.avatar });
    }
    router.push(ROUTES.HOME);
  };

  if (isLoading) {
    return (
      <AuthCard>
        <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
          Xin chào, phụ huynh!
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500">Đang tải danh sách...</p>
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </AuthCard>
    );
  }

  if (error) {
    return (
      <AuthCard>
        <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
          Xin chào, phụ huynh!
        </h2>
        <p className="mb-6 text-center text-sm text-red-500">
          Không thể tải danh sách con. Vui lòng thử lại.
        </p>
        <Button onClick={() => router.push("/login")} className="mt-6 h-12 w-full">
          Quay lại đăng nhập
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-900">
        Xin chào, phụ huynh!
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500">Chọn tài khoản con để tiếp tục</p>

      <div className="space-y-3" role="radiogroup" aria-label="Chọn tài khoản con">
        {children.length > 0 ? (
          children.map((child) => (
            <SelectionCard
              key={child.id}
              selected={selectedChildId === child.id}
              onClick={() => setSelectedChildId(child.id)}
              avatar={child.avatar}
              title={child.name}
              subtitle=""
              avatarClassName="rounded-full"
            />
          ))
        ) : (
          <p className="text-center text-sm text-gray-500">
            Không tìm thấy tài khoản con nào.
          </p>
        )}
      </div>

      <Button
        onClick={handleContinue}
        disabled={!selectedChildId || children.length === 0}
        className="mt-6 h-12 w-full"
      >
        Tiếp tục
      </Button>
    </AuthCard>
  );
}
