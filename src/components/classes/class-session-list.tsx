"use client";

import { useState } from "react";
import { CalendarPlus, Wand2 } from "lucide-react";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useClassSessions } from "@/hooks/queries/use-sessions";
import { toTimeOfDay } from "@/lib/class-schedule-validation";
import { formatVnDateOnly } from "@/lib/vn-datetime";
import type { SessionStatus } from "@/services/session.service";

const PAGE_SIZE = 20;

const STATUS_META: Record<SessionStatus, { label: string; variant: "default" | "success" | "warning" | "outline" | "destructive" }> = {
  scheduled: { label: "Đã lên lịch", variant: "default" },
  in_progress: { label: "Đang diễn ra", variant: "warning" },
  completed: { label: "Đã kết thúc", variant: "success" },
  cancelled: { label: "Đã huỷ", variant: "destructive" },
};

/** Các buổi học cụ thể của lớp (theo ngày tăng dần, 20 buổi/trang) kèm nút sinh buổi và thêm buổi lẻ khi `canWrite`. */
export function ClassSessionList({
  classId,
  canWrite,
  hasSchedules,
  onGenerate,
  onAdd,
}: {
  classId: string;
  canWrite: boolean;
  hasSchedules: boolean;
  onGenerate: () => void;
  onAdd: () => void;
}) {
  const [page, setPage] = useState(1);
  const query = useClassSessions(classId, { page, page_size: PAGE_SIZE });
  const sessions = query.data?.sessions ?? [];
  const total = query.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-base">Buổi học ({total})</CardTitle>
        {canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerate}
              disabled={!hasSchedules}
              title={hasSchedules ? undefined : "Thêm lịch học hằng tuần trước"}
            >
              <Wand2 className="mr-1 h-4 w-4" aria-hidden="true" /> Sinh buổi học
            </Button>
            <Button size="sm" variant="outline" onClick={onAdd}>
              <CalendarPlus className="mr-1 h-4 w-4" aria-hidden="true" /> Thêm buổi học lẻ
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <QueryState
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          isEmpty={sessions.length === 0}
          emptyTitle="Chưa có buổi học nào"
          emptyDescription="Sinh buổi học từ lịch hằng tuần hoặc thêm một buổi học lẻ để bắt đầu điểm danh."
        >
          <ul className="divide-y divide-border">
            {sessions.map((s) => {
              const meta = STATUS_META[s.status] ?? STATUS_META.scheduled;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatVnDateOnly(s.date)} · {toTimeOfDay(s.start_time)}–{toTimeOfDay(s.end_time)}
                    </p>
                    {s.topic && <p className="truncate text-xs text-muted-foreground">{s.topic}</p>}
                  </div>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </li>
              );
            })}
          </ul>
        </QueryState>
        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trang trước
            </Button>
            <span className="text-muted-foreground">Trang {page} / {pageCount}</span>
            <Button size="sm" variant="outline" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
              Trang sau
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
