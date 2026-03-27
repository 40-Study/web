"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams, notFound } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn, formatCurrency } from "@/lib/utils";
import { CourseHero } from "@/components/course/course-hero";
import { CourseSyllabus } from "@/components/course/course-syllabus";
import { CourseReviews } from "@/components/course/course-reviews";
import { InstructorCard } from "@/components/course/instructor-card";
import { useCourseBySlug, useEnrolledCourses, useEnrollCourse } from "@/hooks/use-courses";
import {
  getMockCourseDetail,
  mockEnrolledCourses as mockFallbackEnrolledCourses,
  resolveCourseSlug,
} from "@/lib/mock-data/courses";

type TabType = "overview" | "syllabus" | "instructor" | "reviews";

const TABS: { id: TabType; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "syllabus", label: "Nội dung" },
  { id: "instructor", label: "Giảng viên" },
  { id: "reviews", label: "Đánh giá" },
];

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-[400px] bg-muted" />
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div className="h-10 w-1/3 rounded bg-muted" />
        <div className="space-y-4">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-5/6 rounded bg-muted" />
          <div className="h-4 w-4/6 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawSlug = params.slug;
  const slug = resolveCourseSlug(rawSlug);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [justEnrolled, setJustEnrolled] = useState(false);

  const { data: apiCourse, isLoading } = useCourseBySlug(slug);
  const { data: enrolledCourses = [] } = useEnrolledCourses();
  const enrollMutation = useEnrollCourse();

  const fallbackCourse = getMockCourseDetail(slug);
  const resolvedCourse = apiCourse ?? fallbackCourse;

  const enrolledCourse = useMemo(() => {
    const apiMatched = enrolledCourses.find((course) => {
      const enrolledSlug = resolveCourseSlug(course.slug);
      return enrolledSlug === slug || course.slug === rawSlug;
    });

    if (apiMatched) {
      return apiMatched;
    }

    return mockFallbackEnrolledCourses.find((course) => {
      const enrolledSlug = resolveCourseSlug(course.slug);
      return enrolledSlug === slug || course.slug === rawSlug;
    });
  }, [enrolledCourses, rawSlug, slug]);

  const isEnrolled = Boolean(enrolledCourse) || justEnrolled;
  const progress = enrolledCourse?.progress ?? 0;
  const showCheckout = searchParams.get("checkout") === "1";

  const firstLessonId = useMemo(() => {
    if (!resolvedCourse) return "l1";
    return resolvedCourse.sections.flatMap((section) => section.lessons)[0]?.id ?? "l1";
  }, [resolvedCourse]);

  const previewLessonId = useMemo(() => {
    if (!resolvedCourse) return firstLessonId;

    const allLessons = resolvedCourse.sections.flatMap((section) => section.lessons);
    return allLessons.find((lesson) => lesson.isFreePreview)?.id ?? firstLessonId;
  }, [firstLessonId, resolvedCourse]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!resolvedCourse) {
    notFound();
  }

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
      toast.success("Bạn đã đăng ký khóa học. Sẵn sàng vào học!");
    } catch {
      // Toast error is already handled in mutation hook
    }
  };

  const handlePreview = () => {
    if (!resolvedCourse.previewVideoUrl) {
      toast.info("Khóa học này chưa có video demo");
      return;
    }

    window.open(resolvedCourse.previewVideoUrl, "_blank", "noopener,noreferrer");
  };

  const handleTrial = () => {
    router.push(`/learn/${courseSlug}/${previewLessonId}`);
  };

  const handleBuyNow = () => {
    router.push(`/courses/${courseSlug}?checkout=1`);
  };

  return (
    <div>
      <CourseHero
        course={resolvedCourse}
        isEnrolled={isEnrolled}
        progress={progress}
        onEnroll={handleEnroll}
        onPreview={handlePreview}
        onStartLearning={handleStartLearning}
        onTrial={handleTrial}
        onBuyNow={handleBuyNow}
      />

      {showCheckout && !isEnrolled && resolvedCourse.price > 0 && (
        <div className="border-b bg-amber-50/70">
          <div className="container mx-auto px-4 py-6">
            <div className="rounded-xl border border-amber-200 bg-white p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Checkout
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">Xác nhận thanh toán khóa học</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{resolvedCourse.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tổng thanh toán</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {formatCurrency(resolvedCourse.price)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => toast.success("Đã chuyển sang bước thanh toán")}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Thanh toán ngay
                </button>
                <button
                  onClick={() => router.push(`/courses/${courseSlug}`)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Quay lại chi tiết khóa học
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-16 z-40 border-b bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex gap-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "whitespace-nowrap border-b-2 py-4 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-primary-500 text-primary-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {activeTab === "overview" && (
              <>
                {!isEnrolled && resolvedCourse.price > 0 && (
                  <section className="rounded-xl border bg-muted/30 p-6">
                    <h2 className="text-xl font-semibold">Khóa học này dành cho ai?</h2>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      <li>• Người muốn học bài bản từ nền tảng đến triển khai dự án thực tế.</li>
                      <li>• Người cần portfolio hoặc nâng cấp kỹ năng để đi làm nhanh hơn.</li>
                      <li>• Người muốn có lộ trình rõ ràng, thực hành liên tục theo từng phần.</li>
                    </ul>
                  </section>
                )}

                <section>
                  <h2 className="mb-4 text-xl font-semibold">Bạn sẽ học được gì</h2>
                  <div className="grid gap-3 rounded-lg bg-muted/50 p-6 sm:grid-cols-2">
                    {resolvedCourse.learningOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-xp" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {resolvedCourse.requirements && resolvedCourse.requirements.length > 0 && (
                  <section>
                    <h2 className="mb-4 text-xl font-semibold">Yêu cầu</h2>
                    <ul className="space-y-2">
                      {resolvedCourse.requirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                <section>
                  <h2 className="mb-4 text-xl font-semibold">Mô tả khóa học</h2>
                  <p className="leading-relaxed text-muted-foreground">{resolvedCourse.description}</p>
                </section>

                <CourseSyllabus sections={resolvedCourse.sections} isEnrolled={isEnrolled} />
              </>
            )}

            {activeTab === "syllabus" && (
              <CourseSyllabus sections={resolvedCourse.sections} isEnrolled={isEnrolled} />
            )}

            {activeTab === "instructor" && <InstructorCard instructor={resolvedCourse.instructor} />}

            {activeTab === "reviews" && (
              <CourseReviews
                rating={resolvedCourse.rating}
                reviewCount={resolvedCourse.reviewCount}
                reviews={resolvedCourse.reviews}
                ratingDistribution={resolvedCourse.ratingDistribution}
                hasMore={resolvedCourse.reviews.length >= 3}
                onLoadMore={() => console.log("Load more reviews")}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              <div className="space-y-4 rounded-lg border p-6">
                <h3 className="font-semibold">Thông tin khóa học</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trình độ</span>
                    <span className="font-medium capitalize">
                      {resolvedCourse.level === "beginner"
                        ? "Cơ bản"
                        : resolvedCourse.level === "intermediate"
                        ? "Trung cấp"
                        : "Nâng cao"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số bài học</span>
                    <span className="font-medium">{resolvedCourse.lessonCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời lượng</span>
                    <span className="font-medium">{Math.floor(resolvedCourse.duration / 60)} giờ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngôn ngữ</span>
                    <span className="font-medium">{resolvedCourse.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Học viên</span>
                    <span className="font-medium">{resolvedCourse.studentCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-6">
                <h3 className="mb-4 font-semibold">Giảng viên</h3>
                <div className="flex items-center gap-3">
                  <img
                    src={resolvedCourse.instructor.avatar}
                    alt={resolvedCourse.instructor.name}
                    className="h-12 w-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{resolvedCourse.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">{resolvedCourse.instructor.title}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
