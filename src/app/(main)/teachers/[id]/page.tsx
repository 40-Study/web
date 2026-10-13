"use client";

/**
 * Hồ sơ giảng viên công khai (PG-M2): cho khách xem người dạy là ai trước khi mua khoá. Dữ liệu từ
 * GET /teachers/:id/public-profile (không email/điện thoại/ngân hàng); chỉ khoá học đã xuất bản.
 */

import { useParams, notFound } from "next/navigation";
import { BadgeCheck, BookOpen, GraduationCap, Star, Users } from "lucide-react";
import { CourseGrid } from "@/components/course/course-grid";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeacherPublicProfile } from "@/hooks/queries/use-teacher-public-profile";
import { mapApiCourse } from "@/hooks/use-courses";
import { getErrorMessage } from "@/lib/error-messages";
import { formatDate } from "@/lib/utils";
import type { PublicTeacherProfile } from "@/services/teacher.service";

function Stat({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <Icon className="mb-2 h-5 w-5 text-primary-600" aria-hidden="true" />
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function ProfileBody({ profile }: { profile: PublicTeacherProfile }) {
  const name = profile.full_name?.trim() || profile.user_name;
  const { stats } = profile;
  // Khoá học hiển thị bằng CourseCard chung; thẻ cần tên giảng viên nên gắn chính hồ sơ này.
  const courses = profile.courses.map((c) =>
    mapApiCourse({
      ...c,
      short_description: c.short_description ?? undefined,
      thumbnail_url: c.thumbnail_url ?? undefined,
      discount_price: c.discount_price ?? undefined,
      published_at: c.published_at ?? undefined,
      instructor_id: profile.id,
      instructor: { id: profile.id, name },
    }),
  );

  return (
    <div className="page-container space-y-8 py-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar src={profile.avatar_url ?? undefined} fallback={name} size="xl" />
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold">{name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {profile.is_verified && (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <BadgeCheck className="h-4 w-4" aria-hidden="true" /> Đã xác minh
              </span>
            )}
            <span>Tham gia từ {formatDate(profile.joined_at)}</span>
          </div>
        </div>
      </header>

      <section aria-label="Thống kê" className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={BookOpen} label="Khoá học" value={stats.course_count.toLocaleString("vi-VN")} />
        <Stat icon={Users} label="Học viên" value={stats.student_count.toLocaleString("vi-VN")} />
        <Stat icon={GraduationCap} label="Lượt đánh giá" value={stats.review_count.toLocaleString("vi-VN")} />
        <Stat
          icon={Star}
          label="Điểm trung bình"
          value={stats.review_count > 0 ? stats.average_rating.toFixed(1) : "Chưa có"}
        />
      </section>

      {(profile.bio || profile.specialization || profile.education || profile.experience_years != null || profile.department) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Giới thiệu</h2>
          {profile.bio && <p className="max-w-3xl whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>}
          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Chuyên môn" value={profile.specialization} />
            <Fact label="Học vấn" value={profile.education} />
            <Fact
              label="Kinh nghiệm"
              value={profile.experience_years != null ? `${profile.experience_years} năm kinh nghiệm` : null}
            />
            <Fact label="Đơn vị" value={profile.department} />
          </dl>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Khoá học của {name}</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Giảng viên này chưa có khoá học nào được xuất bản.</p>
        ) : (
          <CourseGrid courses={courses} />
        )}
      </section>
    </div>
  );
}

export default function TeacherPublicProfilePage() {
  const params = useParams<{ id: string }>();
  const { data: profile, isLoading, error, refetch, isRefetching } = useTeacherPublicProfile(params.id);

  if (isLoading) {
    return (
      <div className="page-container space-y-6 py-8" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container py-16 text-center" role="alert">
        <h2 className="mb-2 text-xl font-semibold text-destructive">Không tải được hồ sơ giảng viên</h2>
        <p className="mb-4 text-muted-foreground">
          {getErrorMessage(error, "Vui lòng thử lại sau ít phút.")}
        </p>
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          Thử lại
        </Button>
      </div>
    );
  }

  if (!profile) notFound();

  return <ProfileBody profile={profile} />;
}
