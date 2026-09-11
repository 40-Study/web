"use client";

/**
 * Route guard cho /courses/[slug]/learn — H3 trong plans/reports/code-reviewer-
 * 260909-1340-web-logic-integration.md: route này KHÔNG có guard trong khi
 * bản song song (lesson)/learn/[courseSlug]/[lessonId] có RoleGuard.
 *
 * Yêu cầu: đã đăng nhập (STUDENT) VÀ đã enroll khóa học này — kiểm tra qua
 * danh sách khóa học đã enroll (GET /enrollments, đã có sẵn qua
 * useEnrolledCourses). Chưa enroll → redirect về trang chi tiết khóa học.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { useEnrolledCourses } from "@/hooks/use-courses";

function FullscreenLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
    </div>
  );
}

export function LearnRouteGuard({ slug, children }: { slug: string; children: React.ReactNode }) {
  const router = useRouter();
  const { sessionStatus, hasHydrated } = useAuthStore();
  const { data: enrolledCourses, isLoading: enrollmentsLoading } = useEnrolledCourses();

  const stillChecking = !hasHydrated || sessionStatus === "checking" || (sessionStatus === "authenticated" && enrollmentsLoading);
  const isEnrolled = !!enrolledCourses?.some((c) => c.slug === slug);

  useEffect(() => {
    if (stillChecking) return;

    if (sessionStatus !== "authenticated") {
      router.replace(`/login?next=${encodeURIComponent(`/courses/${slug}/learn`)}`);
      return;
    }

    if (!isEnrolled) {
      router.replace(`/courses/${slug}`);
    }
  }, [stillChecking, sessionStatus, isEnrolled, router, slug]);

  if (stillChecking) return <FullscreenLoading />;
  if (sessionStatus !== "authenticated" || !isEnrolled) return null;

  return <>{children}</>;
}
