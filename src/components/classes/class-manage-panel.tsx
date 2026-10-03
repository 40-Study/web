"use client";

import { useState } from "react";
import { Loader2, PlayCircle, UserMinus } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { NotFoundError } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PersonPicker } from "@/components/classes/person-picker";
import {
  useClassById,
  useClassManageActions,
  useClassStudentsById,
  useClassTeachersById,
} from "@/hooks/queries/use-class-manage";
import { getClassStatusLabel, getClassStatusVariant } from "@/lib/class-status";
import { classService } from "@/services/class.service";

type PendingRemoval = { kind: "teacher" | "student"; id: string; name: string };

/**
 * Quản lý một lớp: kích hoạt (draft → active), gán/gỡ giảng viên, ghi danh/gỡ học viên.
 *
 * Quyền do backend quyết (can_manage / can_assign_teachers trong chi tiết lớp, tính bằng chính hàm kiểm của
 * các thao tác ghi), nên nút chỉ hiện khi API sẽ cho làm. Dùng chung cho giảng viên (/teacher/classes/:id)
 * và chủ/quản trị tổ chức (/org/classes/:id).
 */
export function ClassManagePanel({ classId }: { classId: string }) {
  const classQuery = useClassById(classId);
  const teachersQuery = useClassTeachersById(classId);
  const studentsQuery = useClassStudentsById(classId);
  const actions = useClassManageActions(classId);
  const [pending, setPending] = useState<PendingRemoval | null>(null);

  const cls = classQuery.data;
  const canManage = cls?.can_manage === true;
  const canAssignTeachers = cls?.can_assign_teachers === true;
  const teachers = teachersQuery.data ?? [];
  const students = studentsQuery.data?.items ?? [];

  const confirmRemoval = () => {
    if (!pending) return;
    const mutation = pending.kind === "teacher" ? actions.removeTeacher : actions.removeStudent;
    mutation.mutate(pending.id, { onSettled: () => setPending(null) });
  };

  return (
    <QueryState
      isLoading={classQuery.isLoading}
      // Backend trả 404 cho lớp không xem được (lớp của tổ chức khác, lớp cá nhân): hiện "Không tìm thấy lớp", không phải lỗi tải.
      isError={classQuery.isError && !(classQuery.error instanceof NotFoundError)}
      error={classQuery.error}
      onRetry={() => classQuery.refetch()}
      isEmpty={!cls}
      emptyTitle="Không tìm thấy lớp"
      emptyDescription="Lớp không tồn tại hoặc bạn không có quyền xem lớp này."
    >
      {cls && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate text-xl">{cls.name}</CardTitle>
                {cls.description && <p className="mt-1 text-sm text-muted-foreground">{cls.description}</p>}
                <p className="mt-2 text-sm text-muted-foreground">
                  {cls.student_count ?? 0}
                  {cls.max_students ? ` / ${cls.max_students}` : ""} học viên · {cls.teacher_count ?? 0} giảng viên
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getClassStatusVariant(cls.status)}>{getClassStatusLabel(cls.status)}</Badge>
                {canManage && cls.status === "draft" && (
                  <Button onClick={() => actions.update.mutate({ status: "active" })} disabled={actions.update.isPending}>
                    {actions.update.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <PlayCircle className="mr-1 h-4 w-4" aria-hidden="true" />
                    )}
                    Kích hoạt lớp
                  </Button>
                )}
              </div>
            </CardHeader>
            {cls.status === "draft" && (
              <CardContent className="pt-0 text-sm text-muted-foreground">
                Lớp đang ở trạng thái nháp: chưa hoạt động cho tới khi được kích hoạt.
              </CardContent>
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Giảng viên ({teachers.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueryState
                  isLoading={teachersQuery.isLoading}
                  isError={teachersQuery.isError}
                  error={teachersQuery.error}
                  onRetry={() => teachersQuery.refetch()}
                  isEmpty={teachers.length === 0}
                  emptyTitle="Chưa có giảng viên"
                  emptyDescription="Lớp này chưa được gán giảng viên nào."
                >
                  <ul className="divide-y divide-border">
                    {teachers.map((t) => (
                      <li key={t.teacher_id} className="flex items-center justify-between gap-2 py-2">
                        <span className="truncate text-sm font-medium">{t.name}</span>
                        <span className="flex items-center gap-2">
                          <Badge variant="outline">{t.role === "assistant" ? "Trợ giảng" : "Giảng viên chính"}</Badge>
                          {canAssignTeachers && (
                            <Button
                              variant="destructiveGhost"
                              size="sm"
                              aria-label={`Gỡ giảng viên ${t.name}`}
                              onClick={() => setPending({ kind: "teacher", id: t.teacher_id, name: t.name })}
                            >
                              <UserMinus className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </QueryState>
                {canAssignTeachers && (
                  <PersonPicker
                    queryKey={["class-manage", "teacher-candidates", classId]}
                    search={(keyword) => classService.searchTeachers(keyword)}
                    onPick={(id) => actions.assignTeacher.mutate(id)}
                    isPicking={actions.assignTeacher.isPending}
                    placeholder="Tìm giảng viên theo tên"
                    addLabel="Gán"
                    emptyText="Không có giảng viên phù hợp."
                    excludeIds={teachers.map((t) => t.teacher_id)}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Học viên ({studentsQuery.data?.total ?? students.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <QueryState
                  isLoading={studentsQuery.isLoading}
                  isError={studentsQuery.isError}
                  error={studentsQuery.error}
                  onRetry={() => studentsQuery.refetch()}
                  isEmpty={students.length === 0}
                  emptyTitle="Chưa có học viên"
                  emptyDescription="Lớp này chưa có học viên nào."
                >
                  <ul className="divide-y divide-border">
                    {students.map((s) => (
                      <li key={s.student_id} className="flex items-center justify-between gap-2 py-2">
                        <span className="truncate text-sm font-medium">{s.name}</span>
                        {canManage && (
                          <Button
                            variant="destructiveGhost"
                            size="sm"
                            aria-label={`Gỡ học viên ${s.name}`}
                            onClick={() => setPending({ kind: "student", id: s.student_id, name: s.name })}
                          >
                            <UserMinus className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </QueryState>
                {canManage && (
                  <PersonPicker
                    queryKey={["class-manage", "student-candidates", classId]}
                    search={(keyword) => classService.searchEnrollableStudents(classId, keyword)}
                    onPick={(id) => actions.enrollStudent.mutate(id)}
                    isPicking={actions.enrollStudent.isPending}
                    placeholder="Tìm học viên để ghi danh"
                    addLabel="Ghi danh"
                    emptyText="Không có học viên phù hợp."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {!canManage && (
            <p className="text-sm text-muted-foreground">Bạn chỉ có quyền xem lớp này.</p>
          )}
        </div>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.kind === "teacher" ? "Gỡ giảng viên khỏi lớp?" : "Gỡ học viên khỏi lớp?"}</DialogTitle>
            <DialogDescription>
              {pending?.name} sẽ không còn trong lớp này.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={confirmRemoval} disabled={actions.removeTeacher.isPending || actions.removeStudent.isPending}>
              Gỡ khỏi lớp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </QueryState>
  );
}
