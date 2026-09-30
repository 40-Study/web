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
import { getRoleHomeRoute, normalizeRole } from "@/lib/routes";

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, activeRole } = useAuthStore();
  const normalizedRole = normalizeRole(activeRole);

  // Người đã đăng nhập chuyển thẳng về trang chủ theo vai trò
  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated && normalizedRole) {
      router.push(getRoleHomeRoute(normalizedRole));
    }
  }, [hasHydrated, isAuthenticated, normalizedRole, router]);

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
