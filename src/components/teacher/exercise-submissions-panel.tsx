"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { exerciseService, type ExerciseSubmissionRecord } from "@/services/exercise.service";
import { ExerciseSubmissionDetail } from "./exercise-submission-detail";
import {
  formatSubmittedAt,
  studentName,
  submissionScore,
  verdictLabel,
  verdictTone,
} from "./exercise-submission-format";

export const SUBMISSIONS_PAGE_SIZE = 20;

export const exerciseSubmissionKeys = {
  list: (exerciseId: string, page: number) => ["teacher-exercise-submissions", exerciseId, page] as const,
  testCases: (exerciseId: string) => ["teacher-exercise-submissions", exerciseId, "testcases"] as const,
};

interface ExerciseSubmissionsPanelProps {
  exerciseId: string;
  exerciseTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Bài nộp của mọi học viên cho một bài thực hành code (`GET /exercises/:id/submissions`, chỉ người quản lý bài). */
export function ExerciseSubmissionsPanel({ exerciseId, exerciseTitle, open, onOpenChange }: ExerciseSubmissionsPanelProps) {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ExerciseSubmissionRecord | null>(null);

  // Mở cho bài khác thì về trang đầu, bỏ bài nộp đang xem.
  useEffect(() => {
    setPage(1);
    setSelected(null);
  }, [exerciseId]);

  const list = useQuery({
    queryKey: exerciseSubmissionKeys.list(exerciseId, page),
    queryFn: () => exerciseService.getSubmissions(exerciseId, { page, page_size: SUBMISSIONS_PAGE_SIZE }),
    enabled: open && !!exerciseId,
  });
  const testCases = useQuery({
    queryKey: exerciseSubmissionKeys.testCases(exerciseId),
    queryFn: () => exerciseService.getTestCases(exerciseId),
    enabled: open && !!exerciseId && !!selected,
  });

  const submissions = list.data?.data ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / SUBMISSIONS_PAGE_SIZE));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bài nộp của học viên</DialogTitle>
          <DialogDescription>{exerciseTitle}</DialogDescription>
        </DialogHeader>

        {selected ? (
          testCases.isError ? (
            <p role="alert" className="text-sm text-red-600">Không tải được bộ test của bài.</p>
          ) : (
            <ExerciseSubmissionDetail submission={selected} testCases={testCases.data ?? []} onBack={() => setSelected(null)} />
          )
        ) : list.isLoading ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bài nộp…
          </p>
        ) : list.isError ? (
          <div role="alert" className="space-y-2 py-4 text-sm text-red-600">
            <p>Không tải được danh sách bài nộp.</p>
            <Button variant="outline" size="sm" onClick={() => void list.refetch()}>Thử lại</Button>
          </div>
        ) : submissions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Chưa có học viên nào nộp bài.</p>
        ) : (
          <div className="space-y-3">
            <div className="hidden sm:grid grid-cols-[minmax(0,2fr)_8rem_4rem_4rem_5rem_8rem] gap-2 px-2 text-[11px] font-medium text-muted-foreground">
              <span>Học viên</span><span>Kết quả</span><span>Điểm</span><span>Test đạt</span><span>Thời gian</span><span>Nộp lúc</span>
            </div>
            <ul className="space-y-1" aria-label="Danh sách bài nộp">
              {submissions.map((sub) => (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => setSelected(sub)}
                    aria-label={`Xem bài nộp của ${studentName(sub)} lúc ${formatSubmittedAt(sub.created_at)}`}
                    className="grid w-full grid-cols-2 gap-2 rounded-lg border px-2 py-2 text-left text-xs hover:bg-gray-50 sm:grid-cols-[minmax(0,2fr)_8rem_4rem_4rem_5rem_8rem] sm:items-center"
                  >
                    <span className="col-span-2 min-w-0 sm:col-span-1">
                      <span className="block truncate font-medium">{studentName(sub)}</span>
                      {sub.student?.email && <span className="block truncate text-muted-foreground">{sub.student.email}</span>}
                    </span>
                    <span><Badge variant={verdictTone(sub.verdict)} size="sm">{verdictLabel(sub.verdict)}</Badge></span>
                    <span>{submissionScore(sub)}/100</span>
                    <span>{sub.test_cases_passed}/{sub.total_test_cases}</span>
                    <span>{sub.execution_time_ms != null ? `${sub.execution_time_ms} ms` : "—"}</span>
                    <span className="text-muted-foreground">{formatSubmittedAt(sub.created_at)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {pageCount > 1 && (
              <div className="flex items-center justify-end gap-2 text-xs">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Trang trước">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span>Trang {page}/{pageCount} · {total} bài nộp</span>
                <Button variant="outline" size="sm" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)} aria-label="Trang sau">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
