"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Ban, CalendarPlus, Wand2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { QueryState } from "@/components/common/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAllClassSessions, useCancelSession } from "@/hooks/queries/use-sessions";
import { pageContainingToday } from "@/lib/class-session-paging";
import { toTimeOfDay } from "@/lib/class-schedule-validation";
import { formatVnDateOnly, hasVnSessionEnded, hasVnSessionStarted, isVnSessionUpcoming } from "@/lib/vn-datetime";
import type { ClassSession, SessionStatus } from "@/services/session.service";

const PAGE_SIZE = 20;

const STATUS_META: Record<SessionStatus, { label: string; variant: "default" | "success" | "warning" | "outline" | "destructive" }> = {
  scheduled: { label: "Đã lên lịch", variant: "default" },
  in_progress: { label: "Đang diễn ra", variant: "warning" },
  completed: { label: "Đã kết thúc", variant: "success" },
  cancelled: { label: "Đã huỷ", variant: "destructive" },
};

/**
 * Q6-T04: backend không bao giờ chuyển buổi sang "Đã kết thúc" lúc chạy nên buổi đã qua vẫn là `scheduled` và hiện
 * "Đã lên lịch" cạnh buổi sắp tới. Suy trạng thái hiển thị từ giờ VN: đã qua giờ kết thúc -> "Đã diễn ra"; đã bắt đầu
 * mà chưa kết thúc -> "Đang diễn ra". Chỉ áp cho `scheduled`; trạng thái backend khác giữ nguyên.
 */
export const SESSION_HELD_META = { label: "Đã diễn ra", variant: "outline" } as const;

export function sessionDisplayMeta(s: ClassSession, now: Date = new Date()) {
  if (s.status === "scheduled") {
    if (hasVnSessionEnded(s.date, s.end_time, now, s.start_time)) return SESSION_HELD_META;
    // Chỉ "Đang diễn ra" khi CHỨNG MINH được đã bắt đầu; thiếu/sai giờ bắt đầu thì giữ "Đã lên lịch" (không tuyên bố thứ không biết).
    if (hasVnSessionStarted(s.date, s.start_time, now)) return STATUS_META.in_progress;
  }
  return STATUS_META[s.status] ?? STATUS_META.scheduled;
}

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
  // Q8-T06: lấy MỌI buổi rồi phân trang tại chỗ; lần đầu có dữ liệu thì nhảy tới trang chứa hôm nay (danh sách xếp cũ trước).
  const query = useAllClassSessions(classId);
  const cancel = useCancelSession(classId);
  // Q5-T02: buổi đang chờ xác nhận huỷ (null = đóng hộp thoại).
  const [cancelling, setCancelling] = useState<ClassSession | null>(null);
  const allSessions = useMemo(() => query.data?.sessions ?? [], [query.data]);
  const total = allSessions.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // Ghi nhớ lớp đã nhảy tới hôm nay: đổi `classId` mà không remount thì nhảy lại cho lớp mới.
  const jumpedForClass = useRef<string | null>(null);
  useEffect(() => {
    if (jumpedForClass.current === classId || allSessions.length === 0) return;
    jumpedForClass.current = classId;
    setPage(pageContainingToday(allSessions, PAGE_SIZE));
  }, [allSessions, classId]);
  const currentPage = Math.min(page, pageCount);
  const sessions = allSessions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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
          hasData={query.data !== undefined}
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
              const meta = sessionDisplayMeta(s);
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {formatVnDateOnly(s.date)} · {toTimeOfDay(s.start_time)}–{toTimeOfDay(s.end_time)}
                    </p>
                    {s.topic && <p className="truncate text-xs text-muted-foreground">{s.topic}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={meta.variant} className="whitespace-nowrap">{meta.label}</Badge>
                    {/* Q5-T02 (M1): backend không tự chuyển buổi sang "Đã kết thúc" nên chỉ buổi CHƯA bắt đầu mới huỷ được. */}
                    {/* Q6-T04: chỗ nút luôn được giữ (kể cả khi trống) để huy hiệu các dòng thẳng hàng. */}
                    {canWrite && (
                      <span className="inline-flex min-w-[6.5rem] justify-end">
                        {s.status === "scheduled" && isVnSessionUpcoming(s.date, s.start_time) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setCancelling(s)}
                          >
                            <Ban className="mr-1 h-4 w-4" aria-hidden="true" /> Huỷ buổi
                          </Button>
                        )}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </QueryState>
        {pageCount > 1 && (
          <div className="flex items-center justify-between text-sm">
            <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              Trang trước
            </Button>
            <span className="text-muted-foreground">Trang {currentPage} / {pageCount}</span>
            <Button size="sm" variant="outline" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
              Trang sau
            </Button>
          </div>
        )}
      </CardContent>
      <ConfirmDialog
        open={cancelling !== null}
        onOpenChange={(next) => {
          if (!next && !cancel.isPending) setCancelling(null);
        }}
        title="Huỷ buổi học?"
        description={
          cancelling
            ? `Buổi học ${formatVnDateOnly(cancelling.date)} · ${toTimeOfDay(cancelling.start_time)}–${toTimeOfDay(cancelling.end_time)} sẽ chuyển sang "Đã huỷ" và lịch nhắc học của buổi cũng ngừng. Học viên sẽ không điểm danh được buổi này.`
            : undefined
        }
        confirmLabel="Huỷ buổi học"
        cancelLabel="Giữ lại"
        destructive
        pending={cancel.isPending}
        onConfirm={() => {
          if (!cancelling) return;
          cancel.mutate({ sessionId: cancelling.id }, { onSettled: () => setCancelling(null) });
        }}
      />
    </Card>
  );
}
