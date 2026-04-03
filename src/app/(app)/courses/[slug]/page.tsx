"use client";

/**
 * Course detail page - 2-column layout
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
  const slug = params.slug;

  const [justEnrolled, setJustEnrolled] = useState(false);

  const { data: course, isLoading, error } = useCourseBySlug(slug);
  const { data: enrolledCourses = [] } = useEnrolledCourses();
  const enrollMutation = useEnrollCourse();

  const enrolledCourse = useMemo(() => {
    return enrolledCourses.find((c) => c.slug === slug || c.id === course?.id);
  }, [enrolledCourses, slug, course?.id]);

  const isEnrolled = Boolean(enrolledCourse) || justEnrolled;
  const progress = enrolledCourse?.progress ?? 0;

  const firstLessonId = useMemo(() => {
    if (!course) return null;
    return course.sections?.flatMap((s) => s.lessons)[0]?.id ?? null;
  }, [course]);

  const previewLessonId = useMemo(() => {
    if (!course) return firstLessonId;
    const allLessons = course.sections?.flatMap((s) => s.lessons) ?? [];
    return allLessons.find((l) => l.isFreePreview)?.id ?? firstLessonId;
  }, [firstLessonId, course]);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-2">Lỗi tải khóa học</h2>
        <p className="text-muted-foreground mb-4">
          {error instanceof Error ? error.message : "Không thể tải thông tin khóa học"}
        </p>
        <p className="text-sm text-muted-foreground">Slug: {slug}</p>
      </div>
    );
  }

  if (!course) notFound();

  const courseSlug = course.slug;

  const handleStartLearning = () => {
    if (firstLessonId) router.push(`/learn/${courseSlug}/${firstLessonId}`);
  };

  const handleEnroll = async () => {
    if (isEnrolled) {
      handleStartLearning();
      return;
    }
    try {
      await enrollMutation.mutateAsync(String(course.id));
      setJustEnrolled(true);
      toast.success("Đăng ký thành công! Sẵn sàng vào học.");
    } catch {
      // Error toast handled inside mutation hook
    }
  };

  const handleTrial = () => {
    if (previewLessonId) router.push(`/learn/${courseSlug}/${previewLessonId}`);
  };

  return (
    <div>
      <CourseDetailHeader course={course} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <CourseDetailContent course={course} isEnrolled={isEnrolled} courseSlug={courseSlug} />
          </div>

          <div className="lg:col-span-1">
            <CourseDetailSidebar
              course={course}
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
