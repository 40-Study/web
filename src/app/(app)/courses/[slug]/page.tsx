"use client";

/**
 * Course detail page - redesigned with 2-column layout
 * Left: learning outcomes, syllabus, requirements, instructor
 * Right: sticky sidebar with video preview, price, CTAs, voucher
 */

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import { CourseDetailHeader } from "@/components/course/course-detail-header";
import { CourseDetailContent } from "@/components/course/course-detail-content";
import { CourseDetailSidebar } from "@/components/course/course-detail-sidebar";
import { useCourseBySlug, useEnrolledCourses, useEnrollCourse } from "@/hooks/use-courses";
import {
  getMockCourseDetail,
  mockEnrolledCourses as mockFallbackEnrolledCourses,
  resolveCourseSlug,
} from "@/lib/mock-data/courses";

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-48 bg-primary-900/80" />
      <div className="container mx-auto grid gap-8 px-4 py-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-6 w-1/3 rounded bg-muted" />
          <div className="h-32 rounded bg-muted" />
          <div className="h-48 rounded bg-muted" />
        </div>
        <div className="h-80 rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const rawSlug = params.slug;
  const slug = resolveCourseSlug(rawSlug);

  const [justEnrolled, setJustEnrolled] = useState(false);

  const { data: apiCourse, isLoading } = useCourseBySlug(slug);
  const { data: enrolledCourses = [] } = useEnrolledCourses();
  const enrollMutation = useEnrollCourse();

  const fallbackCourse = getMockCourseDetail(slug);
  const resolvedCourse = apiCourse ?? fallbackCourse;

  const enrolledCourse = useMemo(() => {
    const apiMatched = enrolledCourses.find((c) => {
      const s = resolveCourseSlug(c.slug);
      return s === slug || c.slug === rawSlug;
    });
    if (apiMatched) return apiMatched;
    return mockFallbackEnrolledCourses.find((c) => {
      const s = resolveCourseSlug(c.slug);
      return s === slug || c.slug === rawSlug;
    });
  }, [enrolledCourses, rawSlug, slug]);

  const isEnrolled = Boolean(enrolledCourse) || justEnrolled;
  const progress = enrolledCourse?.progress ?? 0;

  const firstLessonId = useMemo(() => {
    if (!resolvedCourse) return "l1";
    return resolvedCourse.sections.flatMap((s) => s.lessons)[0]?.id ?? "l1";
  }, [resolvedCourse]);

  const previewLessonId = useMemo(() => {
    if (!resolvedCourse) return firstLessonId;
    const allLessons = resolvedCourse.sections.flatMap((s) => s.lessons);
    return allLessons.find((l) => l.isFreePreview)?.id ?? firstLessonId;
  }, [firstLessonId, resolvedCourse]);

  if (isLoading) return <LoadingSkeleton />;
  if (!resolvedCourse) notFound();

  const courseSlug = resolveCourseSlug(resolvedCourse.slug);

  const handleStartLearning = () => {
    router.push(`/learn/${courseSlug}/${firstLessonId}`);
  };

  const handleEnroll = async () => {
    if (isEnrolled) {
      handleStartLearning();
      return;
    }
    try {
      await enrollMutation.mutateAsync(String(resolvedCourse.id));
      setJustEnrolled(true);
      toast.success("Đăng ký thành công! Sẵn sàng vào học.");
    } catch {
      // Error toast handled inside mutation hook
    }
  };

  const handleTrial = () => {
    router.push(`/learn/${courseSlug}/${previewLessonId}`);
  };

  return (
    <div>
      {/* Blue header: breadcrumb + title + badges */}
      <CourseDetailHeader course={resolvedCourse} />

      {/* Main 2-column layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: content */}
          <div className="lg:col-span-2">
            <CourseDetailContent
              course={resolvedCourse}
              isEnrolled={isEnrolled}
              courseSlug={courseSlug}
            />
          </div>

          {/* Right: sticky sidebar */}
          <div className="lg:col-span-1">
            <CourseDetailSidebar
              course={resolvedCourse}
              isEnrolled={isEnrolled}
              progress={progress}
              onEnroll={handleEnroll}
              onStartLearning={handleStartLearning}
              onTrial={handleTrial}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
