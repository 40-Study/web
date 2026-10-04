"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { formatDateTime } from "@/components/grading/submission-grade-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAssignmentsByClass } from "@/hooks/queries/use-assignments";
import { useClassById } from "@/hooks/queries/use-class-manage";
import { NotFoundError } from "@/lib/errors";
import type { AssignmentType } from "@/services/assignment.service";

const TYPE_LABELS: Record<AssignmentType, string> = {
  live_coding: "Bài trong buổi live",
  homework: "Bài tập về nhà",
  project: "Dự án",
};

interface ClassAssignmentsListProps {
  classId: string;
  /** Đích khi bấm một bài tập (khu tổ chức dẫn tới trang chấm). */
  hrefFor: (assignmentId: string) => string;
}

/**
 * Danh sách bài tập của một lớp, mỗi dòng dẫn tới trang chấm bài.
 * Chỉ ẩn khi chính LỚP là 404 (ClassManagePanel cạnh bên đã hiện "Không tìm thấy lớp", dùng chung query chi tiết
 * lớp). Lớp xem được mà riêng endpoint bài tập lỗi (kể cả 404) thì vẫn hiện lỗi, không để mục biến mất im lặng.
 */
export function ClassAssignmentsList({ classId, hrefFor }: ClassAssignmentsListProps) {
  const classQuery = useClassById(classId);
  const query = useAssignmentsByClass(classId);

  if (classQuery.error instanceof NotFoundError) return null;

  const items = query.data?.data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bài tập{query.data ? ` (${query.data.total ?? items.length})` : ""}</CardTitle>
      </CardHeader>
      <CardContent>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          isEmpty={items.length === 0}
          emptyTitle="Lớp chưa có bài tập"
          emptyDescription="Khi giảng viên giao bài tập cho lớp, bài sẽ xuất hiện ở đây để bạn xem bài nộp và chấm điểm."
        >
          <ul className="divide-y divide-border">
            {items.map((a) => (
              <li key={a.id}>
                <Link
                  href={hrefFor(a.id)}
                  className="flex items-center justify-between gap-3 rounded-md py-3 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{a.title}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {TYPE_LABELS[a.type] ?? a.type} · Hạn nộp: {formatDateTime(a.end_time)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={a.is_published ? "success" : "outline"}>{a.is_published ? "Đã công bố" : "Nháp"}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </QueryState>
      </CardContent>
    </Card>
  );
}
