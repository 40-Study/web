"use client";

import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CourseHero } from "@/components/course/course-hero";
import { CourseSyllabus } from "@/components/course/course-syllabus";
import { CourseReviews } from "@/components/course/course-reviews";
import { InstructorCard } from "@/components/course/instructor-card";
import { useCourseDetail } from "@/hooks/use-courses";

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
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="h-10 bg-muted rounded w-1/3" />
        <div className="space-y-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-4 bg-muted rounded w-4/6" />
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const { data: course, isLoading, error } = useCourseDetail(slug);

  // For demo purposes - simulate enrollment status
  const [isEnrolled] = useState(false);
  const progress = 35;

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !course) {
    notFound();
  }

  const handleEnroll = () => {
    // TODO: Implement enrollment logic
    console.log("Enrolling in course:", course.slug);
  };

  const handlePreview = () => {
    // TODO: Open video preview modal
    console.log("Opening preview for:", course.slug);
  };

  return (
    <div>
      {/* Hero Section */}
      <CourseHero
        course={course}
        isEnrolled={isEnrolled}
        progress={progress}
        onEnroll={handleEnroll}
        onPreview={handlePreview}
      />

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 bg-background border-b">
        <div className="container mx-auto px-4">
          <nav className="flex gap-8 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
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

      {/* Tab Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <>
                {/* What You'll Learn */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">
                    Bạn sẽ học được gì
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-3 p-6 bg-muted/50 rounded-lg">
                    {course.learningOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-xp flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Requirements */}
                {course.requirements && course.requirements.length > 0 && (
                  <section>
                    <h2 className="text-xl font-semibold mb-4">Yêu cầu</h2>
                    <ul className="space-y-2">
                      {course.requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-muted-foreground">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Description */}
                <section>
                  <h2 className="text-xl font-semibold mb-4">Mô tả khóa học</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    {course.description}
                  </p>
                </section>

                {/* Syllabus Preview */}
                <CourseSyllabus
                  sections={course.sections}
                  isEnrolled={isEnrolled}
                />
              </>
            )}

            {/* Syllabus Tab */}
            {activeTab === "syllabus" && (
              <CourseSyllabus
                sections={course.sections}
                isEnrolled={isEnrolled}
              />
            )}

            {/* Instructor Tab */}
            {activeTab === "instructor" && (
              <InstructorCard instructor={course.instructor} />
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <CourseReviews
                rating={course.rating}
                reviewCount={course.reviewCount}
                reviews={course.reviews}
                ratingDistribution={course.ratingDistribution}
                hasMore={course.reviews.length >= 3}
                onLoadMore={() => console.log("Load more reviews")}
              />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 space-y-6">
              {/* Course Stats Card */}
              <div className="border rounded-lg p-6 space-y-4">
                <h3 className="font-semibold">Thông tin khóa học</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trình độ</span>
                    <span className="font-medium capitalize">
                      {course.level === "beginner"
                        ? "Cơ bản"
                        : course.level === "intermediate"
                        ? "Trung cấp"
                        : "Nâng cao"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số bài học</span>
                    <span className="font-medium">{course.lessonCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Thời lượng</span>
                    <span className="font-medium">
                      {Math.floor(course.duration / 60)} giờ
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ngôn ngữ</span>
                    <span className="font-medium">{course.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Học viên</span>
                    <span className="font-medium">
                      {course.studentCount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructor Mini Card */}
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Giảng viên</h3>
                <div className="flex items-center gap-3">
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{course.instructor.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.instructor.title}
                    </p>
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
