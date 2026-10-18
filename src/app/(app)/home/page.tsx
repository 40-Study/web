"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";
import { ParentHomeOverview } from "@/components/parent";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole, user } = useAuthStore();
  const userId = user?.id || "anonymous";

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hasHydrated, isAuthenticated, router]);

  // Wait for hydration and auth check
  if (!hasHydrated || !isAuthenticated) return null;

  // QA 260927 P1: `/home` của phụ huynh trước đây render nguyên dashboard học
  // sinh (0 khoá, 0% tiến độ...) — rẽ nhánh sớm để phụ huynh không gọi các
  // hook chỉ có ý nghĩa cho học sinh (enrollments/schedules của CHÍNH họ).
  if (normalizeRole(activeRole) === "PARENT") {
    return <ParentHomeOverview />;
  }

  return <HomeDashboard key={userId} />;
}
