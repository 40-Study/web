"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, GraduationCap, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyClasses } from "@/hooks/queries/use-classes";
import { getClassStatusLabel, getClassStatusVariant } from "@/lib/class-status";

/**
 * QA2 Q2-06: danh sách mọi lớp giảng viên phụ trách (`GET /classes/me`). Trước đây lớp chỉ vào được từ
 * chi tiết khoá học nên `/teacher/classes` là 404. Mỗi dòng dẫn tới trang quản lý và điểm danh của lớp.
 */
export default function TeacherClassesPage() {
  const { data: classes = [], isLoading, isError, refetch, isRefetching } = useMyClasses();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Lớp học của tôi</h1>
        <p className="text-sm text-muted-foreground">
          Các lớp bạn đang phụ trách. Tạo lớp mới trong trang chi tiết của từng khoá học.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : isError ? (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">Không tải được danh sách lớp. Vui lòng thử lại.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
            Thử lại
          </Button>
        </div>
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Bạn chưa có lớp nào"
          description="Mở một khoá học của bạn và tạo lớp để bắt đầu ghi danh học viên."
          action={
            <Link href="/teacher/courses" className="text-sm font-medium text-primary-600 hover:underline">
              Tới khoá học của tôi
            </Link>
          }
        />
      ) : (
        <ul className="space-y-3">
          {classes.map((cls) => (
            <li key={cls.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/teacher/classes/${cls.id}`} className="truncate font-semibold hover:text-primary-600">
                    {cls.name}
                  </Link>
                  <Badge variant={getClassStatusVariant(cls.status)}>{getClassStatusLabel(cls.status)}</Badge>
                </div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {cls.student_count ?? 0} học viên · {cls.teacher_count ?? 0} giảng viên
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/teacher/classes/${cls.id}/attendance`}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:border-primary-300 hover:text-primary-600"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" /> Điểm danh
                </Link>
                {cls.course_id && (
                  <Link
                    href={`/teacher/courses/${cls.course_id}`}
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:border-primary-300 hover:text-primary-600"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden="true" /> Xem khoá học
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
