"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { ShowcasePanel } from "@/components/landing/showcase-panel";
import { FeatureBento } from "@/components/landing/feature-bento";
import { FeaturedCourses } from "@/components/landing/featured-courses";
import { StatsStrip } from "@/components/landing/stats-strip";
import { FinalCta } from "@/components/landing/final-cta";
import { useAuthStore } from "@/stores/auth.store";
import { normalizeRole } from "@/lib/routes";
import { resolveHomeRoute } from "@/lib/role-resolution";
import { useSystemRoleRemap } from "@/hooks/use-system-role-remap";

/** Nội dung trang chủ khách (client). `app/(main)/page.tsx` là server component để xuất được metadata. */
export function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole, roles } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);
  const { needsRemap } = useSystemRoleRemap();

  // Người đã đăng nhập chuyển thẳng về trang chủ theo vai trò
  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated && normalizedRole && !needsRemap) {
      // Vai tuỳ biến của tổ chức quy về vai hệ thống; không quy được thì về chọn vai trò, không bao giờ vào /403 (Q3-05).
      router.push(resolveHomeRoute(normalizedRole, roles));
    }
  }, [hasHydrated, isAuthenticated, normalizedRole, needsRemap, roles, router]);

  // Không render gì khi đang chuyển hướng (tránh nháy nội dung)
  if (hasHydrated && isAuthenticated && normalizedRole) {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden bg-background">
      <HeroSection />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ShowcasePanel />
      </div>
      <FeatureBento />
      <FeaturedCourses />
      <StatsStrip />
      <FinalCta />
    </div>
  );
}
