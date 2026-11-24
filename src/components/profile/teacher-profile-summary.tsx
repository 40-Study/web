"use client";

import Link from "next/link";
import { BookOpen, Loader2, Star, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useMyCourses } from "@/hooks/queries/use-courses";
import { COURSE_STATUS_LABEL, isCourseStatus } from "@/types/approval";
import type { ApiCourse } from "@/services/course.service";

export interface TeachingStats {
  courseCount: number;
  publishedCount: number;
  studentCount: number;
  /** Điểm trung bình có trọng số theo số lượt đánh giá; `null` khi chưa có đánh giá nào. */
  averageRating: number | null;
  reviewCount: number;
}

/** Số liệu giảng dạy từ danh sách khoá của giảng viên (GET /courses/my). */
export function teachingStats(courses: readonly ApiCourse[]): TeachingStats {
  let studentCount = 0;
  let reviewCount = 0;
  let weighted = 0;
  for (const c of courses) {
    studentCount += c.total_students ?? 0;
    const reviews = c.total_reviews ?? 0;
    const rating = Number(c.average_rating);
    if (reviews > 0 && Number.isFinite(rating)) {
      reviewCount += reviews;
      weighted += rating * reviews;
    }
  }
  return {
    courseCount: courses.length,
    publishedCount: courses.filter((c) => c.status === "published").length,
    studentCount,
    averageRating: reviewCount > 0 ? weighted / reviewCount : null,
    reviewCount,
  };
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-primary-50 p-2 text-primary-700">{icon}</div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Q4-T10: hồ sơ của chính giảng viên từng là hồ sơ học viên (cấp, XP, chuỗi ngày, huy hiệu, "Học tiếp để nhận huy
 * hiệu!"). Phần này thay bằng thông tin giảng dạy: khoá học, học viên, đánh giá.
 */
export function TeacherProfileSummary() {
  const { data, isLoading, isError } = useMyCourses();
  const courses = Array.isArray(data) ? (data as ApiCourse[]) : [];
  const stats = teachingStats(courses);

  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Đang tải thông tin giảng dạy...
      </p>
    );
  }
  if (isError) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Không tải được thông tin giảng dạy. Vui lòng thử lại.
      </p>
    );
  }

  return (
    <section aria-label="Thông tin giảng dạy" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon={<BookOpen className="h-5 w-5" />}
          label={`Khoá học (${stats.publishedCount} đã xuất bản)`}
          value={stats.courseCount.toLocaleString("vi-VN")}
        />
        <StatTile icon={<Users className="h-5 w-5" />} label="Học viên" value={stats.studentCount.toLocaleString("vi-VN")} />
        <StatTile
          icon={<Star className="h-5 w-5" />}
          label={stats.reviewCount > 0 ? `Đánh giá trung bình (${stats.reviewCount} lượt)` : "Đánh giá trung bình"}
          value={stats.averageRating === null ? "Chưa có" : stats.averageRating.toFixed(1)}
        />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Khoá học của tôi</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Bạn chưa có khoá học nào.{" "}
            <Link href="/teacher/courses/create" className="font-medium text-primary-600 hover:underline">
              Tạo khoá học đầu tiên
            </Link>
          </p>
        ) : (
          <ul className="divide-y">
            {courses.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <Link href={`/teacher/courses/${c.id}`} className="min-w-0 font-medium hover:text-primary-600">
                  {c.title}
                </Link>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{(c.total_students ?? 0).toLocaleString("vi-VN")} học viên</span>
                  {(c.total_reviews ?? 0) > 0 && <span>{Number(c.average_rating).toFixed(1)} ★</span>}
                  {isCourseStatus(c.status) && <Badge variant="outline">{COURSE_STATUS_LABEL[c.status]}</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
