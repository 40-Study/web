"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignmentTypeLabel, difficultyLabel } from "@/lib/display-labels";
import type { ChildAssignment, ChildAssignmentsResponse } from "@/services/parent-dashboard.service";
import {
  CHILD_ASSIGNMENT_STATE_CLASS,
  CHILD_ASSIGNMENT_STATE_LABEL,
  childAssignmentState,
  isUnfinishedSubmission,
} from "./child-assignments";
import { formatVnDate } from "@/lib/vn-datetime";
import { ChildSectionError } from "./child-section-error";

/** "3/3 TC" là số test case, phụ huynh không hiểu (QA-B-26): ghi thành câu. */
function resultText(a: ChildAssignment): string | null {
  if (a.total_test_cases <= 0) return null;
  return `Đạt ${a.test_cases_passed}/${a.total_test_cases} bài kiểm tra`;
}

/**
 * Tab "Bài tập" của trang chi tiết con. QA-B-23: trước đây mọi bài chưa `completed` đều hiện "Đang làm" màu
 * vàng, kể cả bài quá hạn chưa nộp; trạng thái nay đi qua `childAssignmentState` (cùng hàm với trang chủ và
 * tab Tổng quan). Ô thống kê vẫn lấy `stats` của backend vì nó đếm trên TOÀN BỘ bài (danh sách chỉ là trang
 * đầu), và backend dùng cùng quy tắc: đã nộp thì không bao giờ quá hạn.
 */
export function ChildAssignmentsTab({
  data,
  isLoading,
  isError = false,
  onRetry,
}: {
  data: ChildAssignmentsResponse | undefined;
  isLoading: boolean;
  /** Q8-PG-05: API lỗi không được đọc thành "Chưa có bài tập nào". */
  isError?: boolean;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  if (isError && !data && onRetry) return <ChildSectionError label="danh sách bài tập" onRetry={onRetry} />;
  const stats = data?.stats;
  const assignments = data?.assignments ?? [];
  const now = Date.now();
  const submitted = splitSubmitted(assignments, stats?.total_assignments, now);

  return (
    <div>
      {stats && (
        <>
          <p className="mb-2 text-sm text-gray-500">Tổng {stats.total_assignments} bài tập</p>
          <div className={cn("grid grid-cols-2 gap-3 mb-6", submitted ? "md:grid-cols-5" : "md:grid-cols-4")}>
            <StatCell value={stats.completed} label="Hoàn thành" tone="bg-green-50 text-green-700" />
            {/* Q5-PG-13: "Chờ chấm" là việc của giảng viên. "Cần chú ý" (không phải "Cần làm lại": có cả bài lỗi chấm)
                là đúng tên và đúng nhóm trên tab Tổng quan / trang chủ. */}
            {submitted ? (
              <>
                <StatCell value={submitted.awaiting} label="Chờ chấm" tone="bg-blue-50 text-blue-600" />
                <StatCell value={submitted.retry} label="Cần chú ý" tone="bg-amber-50 text-amber-700" />
              </>
            ) : (
              <StatCell value={stats.in_progress} label="Đã nộp, chưa xong" tone="bg-blue-50 text-blue-600" />
            )}
            <StatCell value={stats.not_started} label="Chưa nộp" tone="bg-gray-50 text-gray-700" />
            <StatCell value={stats.overdue} label="Quá hạn, chưa nộp" tone="bg-red-50 text-red-700" />
          </div>
        </>
      )}

      {assignments.length === 0 ? (
        <p className="text-center text-gray-500 py-4">Chưa có bài tập nào</p>
      ) : (
        <ul className="space-y-2" data-testid="child-assignment-list">
          {assignments.map((a) => {
            const state = childAssignmentState(a, now);
            const result = state === "completed" || state === "needs_retry" ? resultText(a) : null;
            return (
              <li key={a.id} className="p-3 rounded-lg border">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-gray-500">
                      {/* /parent/children/:id/assignments không trả class_name — chỉ hiện khi có */}
                      {a.class_name && <>{a.class_name} | </>}
                      {[assignmentTypeLabel(a.type), difficultyLabel(a.difficulty)].filter(Boolean).join(" | ")}
                    </p>
                    {a.due_date && (
                      <p className="text-xs text-gray-500">
                        Hạn nộp {formatVnDate(a.due_date)}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn("text-sm font-medium", CHILD_ASSIGNMENT_STATE_CLASS[state])}>
                      {CHILD_ASSIGNMENT_STATE_LABEL[state]}
                    </span>
                    {result && <p className="text-xs text-gray-500">{result}</p>}
                    <p className="text-xs text-gray-500">{a.submission_count} lần nộp</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Q5-PG-13: `stats.in_progress` của backend gộp "chờ giảng viên chấm" với "chưa đạt / lỗi chấm", nên ô
 * "Đã nộp, chưa xong" đọc như con đang tụt lại. Tách hai nhóm theo cùng hàm trạng thái với danh sách. Chỉ
 * tách được khi danh sách đã chứa TOÀN BỘ bài (danh sách là trang đầu); thiếu thì trả null và giữ ô gộp
 * của backend thay vì in số sai.
 */
function splitSubmitted(
  assignments: ChildAssignment[],
  total: number | undefined,
  now: number,
): { awaiting: number; retry: number } | null {
  if (total === undefined || assignments.length < total) return null;
  let awaiting = 0;
  let retry = 0;
  for (const a of assignments) {
    const state = childAssignmentState(a, now);
    // Ô theo ĐÚNG nhóm "Cần chú ý" của splitAssignmentsByDeadline (cùng `isUnfinishedSubmission`): bài lỗi chấm
    // nằm ở nhóm đó thì ô cũng đếm ở đó, không đếm vào "Chờ chấm" (review L4).
    if (state === "awaiting_grade") awaiting++;
    else if (isUnfinishedSubmission(state)) retry++;
  }
  return { awaiting, retry };
}

function StatCell({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className={cn("text-center p-3 rounded-lg", tone)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
