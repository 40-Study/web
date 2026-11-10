"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignmentTypeLabel, difficultyLabel } from "@/lib/display-labels";
import type { ChildAssignment, ChildAssignmentsResponse } from "@/services/parent-dashboard.service";
import {
  CHILD_ASSIGNMENT_STATE_CLASS,
  CHILD_ASSIGNMENT_STATE_LABEL,
  childAssignmentState,
} from "./child-assignments";

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
}: {
  data: ChildAssignmentsResponse | undefined;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }
  const stats = data?.stats;
  const assignments = data?.assignments ?? [];
  const now = Date.now();

  return (
    <div>
      {stats && (
        <>
          <p className="mb-2 text-sm text-gray-500">Tổng {stats.total_assignments} bài tập</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <StatCell value={stats.completed} label="Hoàn thành" tone="bg-green-50 text-green-600" />
            <StatCell value={stats.in_progress} label="Đã nộp, chưa xong" tone="bg-blue-50 text-blue-600" />
            <StatCell value={stats.not_started} label="Chưa nộp" tone="bg-gray-50 text-gray-700" />
            <StatCell value={stats.overdue} label="Quá hạn, chưa nộp" tone="bg-red-50 text-red-600" />
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
                      <p className="text-xs text-gray-400">
                        Hạn nộp {new Date(a.due_date).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={cn("text-sm font-medium", CHILD_ASSIGNMENT_STATE_CLASS[state])}>
                      {CHILD_ASSIGNMENT_STATE_LABEL[state]}
                    </span>
                    {result && <p className="text-xs text-gray-500">{result}</p>}
                    <p className="text-xs text-gray-400">{a.submission_count} lần nộp</p>
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

function StatCell({ value, label, tone }: { value: number; label: string; tone: string }) {
  return (
    <div className={cn("text-center p-3 rounded-lg", tone)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
