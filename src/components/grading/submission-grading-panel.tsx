"use client";

/**
 * Bảng chấm bài của một bài tập: danh sách bài nộp, mở xem bài, nhập điểm + nhận xét, hiện ai chấm.
 *
 * HỢP ĐỒNG (cố định, dùng chung với khu quản lý tổ chức): chỉ nhận `{ assignmentId }` và tự lấy dữ liệu qua
 * API. Không giả định người dùng là giảng viên: chủ/quản trị tổ chức của lớp cũng chấm được (backend ghi
 * `graded_by` đúng người), nên mọi chữ trên màn hình đều nói theo "người chấm" chứ không theo vai.
 *
 * Trạng thái "Đã chấm" lấy từ bản ghi điểm (sổ điểm lớp), KHÔNG suy từ verdict của máy chạy test.
 */

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Eye, Filter, Loader2, Pencil, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error-messages";
import { useAssignment } from "@/hooks/queries/use-assignments";
import { useClassById } from "@/hooks/queries/use-class-manage";
import { isClassArchived } from "@/lib/class-status";
import { useSubmissionsByAssignment } from "@/hooks/queries/use-submissions";
import { useCreateGrade, useGradeBook, useUpdateGrade } from "@/hooks/queries/use-grades";
import {
  GRADE_MAX_SCORE,
  buildGradingRows,
  gradeTitleFor,
  type GradingRow,
} from "@/lib/submission-grading";
import type { Grade } from "@/services/grade.service";
import { SubmissionGradeDialog, formatDateTime } from "./submission-grade-dialog";

type StatusFilter = "all" | "ungraded" | "graded" | "late";

export interface SubmissionGradingPanelProps {
  assignmentId: string;
}

export function SubmissionGradingPanel({ assignmentId }: SubmissionGradingPanelProps) {
  const { data: assignment, isLoading: assignmentLoading, error: assignmentError } = useAssignment(assignmentId);
  const classId = assignment?.class_id ?? "";
  const { data: classInfo } = useClassById(classId);
  // Lớp lưu trữ chỉ đọc (backend 409 CLASS_ARCHIVED): xem bài nộp được, không chấm mới/sửa điểm.
  const archived = isClassArchived(classInfo?.status);
  const {
    data: submissionData,
    isLoading: submissionsLoading,
    error: submissionsError,
  } = useSubmissionsByAssignment(assignmentId);
  const { data: gradeBook, isLoading: gradeBookLoading, error: gradeBookError } = useGradeBook(classId);
  const createGrade = useCreateGrade(classId);
  const updateGrade = useUpdateGrade(classId);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  // Gom điểm của cả lớp thành một danh sách phẳng; `students` có thể null khi lớp chưa có điểm nào.
  const grades: Grade[] = useMemo(
    () => (gradeBook?.students ?? []).flatMap((s) => s.grades ?? []),
    [gradeBook],
  );

  const rows = useMemo(
    () =>
      buildGradingRows({
        submissions: submissionData?.data ?? [],
        grades,
        assignmentId,
        endTime: assignment?.end_time,
        graceMinutes: assignment?.allow_late_submission ? assignment.grace_period_minutes : 0,
      }),
    [submissionData, grades, assignmentId, assignment?.end_time, assignment?.allow_late_submission, assignment?.grace_period_minutes],
  );

  const stats = useMemo(
    () => ({
      total: rows.length,
      graded: rows.filter((r) => r.status === "graded").length,
      late: rows.filter((r) => r.late).length,
    }),
    [rows],
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchesSearch = r.studentName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "late" ? r.late : r.status === statusFilter);
        return matchesSearch && matchesStatus;
      }),
    [rows, searchQuery, statusFilter],
  );

  const openRow = rows.find((r) => r.studentId === openStudentId) ?? null;
  const canGrade = !!classId && !archived;

  const saveGrade = async (row: GradingRow, input: { score: number; feedback: string }) => {
    if (row.grade) {
      await updateGrade.mutateAsync({
        gradeId: row.grade.id,
        data: { score: input.score, feedback: input.feedback },
      });
      return;
    }
    await createGrade.mutateAsync({
      student_id: row.studentId,
      grade_type: assignment?.type === "project" ? "project" : "assignment",
      title: gradeTitleFor(assignment?.title ?? ""),
      score: input.score,
      max_score: GRADE_MAX_SCORE,
      assignment_id: assignmentId,
      ...(input.feedback ? { feedback: input.feedback } : {}),
    });
  };

  if (assignmentLoading || submissionsLoading || (canGrade && gradeBookLoading)) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 404 = không xem được bài tập, 403 = thấy nhưng không có quyền xem bài nộp: cả hai đều phải nói rõ.
  // Lỗi tải sổ điểm cũng chặn cả bảng: thiếu điểm thì mọi dòng sẽ hiện "Chưa chấm" sai sự thật.
  const loadError = assignmentError ?? submissionsError ?? (canGrade ? gradeBookError : null);
  if (loadError || !assignment) {
    return (
      <div role="alert" className="py-8 text-center text-muted-foreground">
        {loadError ? getErrorMessage(loadError, "Không tải được bài nộp") : "Không tìm thấy bài tập"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Thống kê */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Tổng bài nộp"
          value={stats.total}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label="Đã chấm điểm"
          value={stats.graded}
          subValue={stats.total > 0 ? `${Math.round((stats.graded / stats.total) * 100)}%` : undefined}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Nộp muộn"
          value={stats.late}
          color="bg-yellow-100 text-yellow-700"
        />
      </div>

      {/* Bộ lọc */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm học viên..."
            aria-label="Tìm kiếm học viên"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-44" aria-label="Lọc theo trạng thái">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="ungraded">Chưa chấm</SelectItem>
            <SelectItem value="graded">Đã chấm</SelectItem>
            <SelectItem value="late">Nộp muộn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {archived && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Lớp đã lưu trữ: chỉ xem bài nộp và điểm đã chấm, không chấm thêm cho tới khi mở lại lớp.
        </p>
      )}

      {!classId && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Bài tập này chưa gắn với lớp nào nên chỉ xem được bài nộp, chưa chấm điểm được.
        </p>
      )}

      {/* Bảng bài nộp */}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px]">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Học viên</th>
              <th className="p-3 text-left text-sm font-medium">Trạng thái</th>
              <th className="p-3 text-left text-sm font-medium">Thời gian nộp</th>
              <th className="p-3 text-left text-sm font-medium">Điểm</th>
              <th className="p-3 text-right text-sm font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.studentId} className="border-t transition-colors hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                      {row.studentName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium">{row.studentName}</span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant={row.status === "graded" ? "success" : "default"}>
                      {row.status === "graded" ? "Đã chấm" : "Chưa chấm"}
                    </Badge>
                    {row.late && <Badge variant="warning">Nộp muộn</Badge>}
                  </div>
                </td>
                <td className="p-3 text-sm text-muted-foreground">
                  {formatDateTime(row.submission.created_at)}
                  {row.attempts > 1 && <span className="block text-xs">{row.attempts} lần nộp</span>}
                </td>
                <td className="p-3">
                  {row.grade ? (
                    <div>
                      <span className="font-medium">
                        {row.grade.score}/{row.grade.max_score}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Chấm bởi {row.grade.graded_by_name || "không rõ"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setOpenStudentId(row.studentId)}>
                      <Eye className="h-4 w-4" />
                      Xem bài
                    </Button>
                    {canGrade && row.status === "ungraded" && (
                      <Button size="sm" className="gap-1" onClick={() => setOpenStudentId(row.studentId)}>
                        <Pencil className="h-4 w-4" />
                        Chấm điểm
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            {rows.length === 0 ? "Chưa có học viên nào nộp bài" : "Không tìm thấy học viên nào"}
          </div>
        )}
      </div>

      {openRow && (
        <SubmissionGradeDialog
          key={openRow.studentId}
          row={openRow}
          canGrade={canGrade}
          isSaving={createGrade.isPending || updateGrade.isPending}
          onClose={() => setOpenStudentId(null)}
          onSave={(input) => saveGrade(openRow, input)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subValue?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className={cn("rounded-lg p-2", color)}>{icon}</div>
        <div>
          <p className="text-2xl font-bold">
            {value}
            {subValue && <span className="ml-1 text-sm font-normal text-muted-foreground">({subValue})</span>}
          </p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
