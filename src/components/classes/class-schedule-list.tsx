"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
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
import { useClassSchedules, useDeleteSchedule } from "@/hooks/queries/use-sessions";
import { toDateOnly, toTimeOfDay, weekdayLabel } from "@/lib/class-schedule-validation";
import { formatVnDateOnly } from "@/lib/vn-datetime";
import type { ClassSchedule } from "@/services/session.service";

function describeRange(schedule: ClassSchedule): string {
  const from = toDateOnly(schedule.effective_from);
  const until = toDateOnly(schedule.effective_until);
  if (!from) return "";
  return until
    ? `Áp dụng ${formatVnDateOnly(from)} – ${formatVnDateOnly(until)}`
    : `Áp dụng từ ${formatVnDateOnly(from)}`;
}

/** Danh sách lịch học lặp hằng tuần của lớp; nút thêm/sửa/xoá chỉ hiện khi `canWrite`. */
export function ClassScheduleList({
  classId,
  canWrite,
  onAdd,
  onEdit,
}: {
  classId: string;
  canWrite: boolean;
  onAdd: () => void;
  onEdit: (schedule: ClassSchedule) => void;
}) {
  const query = useClassSchedules(classId);
  const remove = useDeleteSchedule(classId);
  const [deleting, setDeleting] = useState<ClassSchedule | null>(null);
  const schedules = query.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Lịch học hằng tuần ({schedules.length})</CardTitle>
        {canWrite && (
          <Button size="sm" onClick={onAdd}>
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Thêm lịch học
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          isEmpty={schedules.length === 0}
          emptyTitle="Chưa có lịch học hằng tuần"
          emptyDescription="Thêm lịch học (vd. Thứ hai 18:00–20:00) rồi sinh buổi học để điểm danh."
        >
          <ul className="divide-y divide-border">
            {schedules.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0 text-sm">
                  <p className="font-medium">
                    {weekdayLabel(s.day_of_week)} · {toTimeOfDay(s.start_time)}–{toTimeOfDay(s.end_time)}
                    {s.room ? ` · ${s.room}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">{describeRange(s)}</p>
                </div>
                {canWrite && (
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" aria-label={`Sửa lịch ${weekdayLabel(s.day_of_week)}`} onClick={() => onEdit(s)}>
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    <Button
                      variant="destructiveGhost"
                      size="sm"
                      aria-label={`Xoá lịch ${weekdayLabel(s.day_of_week)}`}
                      onClick={() => setDeleting(s)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </QueryState>
      </CardContent>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xoá lịch học này?</DialogTitle>
            <DialogDescription>
              {deleting ? `${weekdayLabel(deleting.day_of_week)} ${toTimeOfDay(deleting.start_time)}–${toTimeOfDay(deleting.end_time)}. ` : ""}
              Các buổi học đã sinh ra từ lịch này vẫn được giữ lại.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Huỷ</Button>
            <Button
              variant="destructive"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting.id, { onSettled: () => setDeleting(null) })}
            >
              Xoá lịch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
