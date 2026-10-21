"use client";

import { CODE_VERDICT_LABELS } from "@/components/code-workspace/code-judge-result";
import type { LessonCodeHistoryItem } from "@/services/lesson-code.service";

// Bài nộp cũ có thể mang trạng thái không có trong kết quả chấm đồng bộ (route nộp bài cũ qua hàng đợi).
const HISTORY_VERDICT_LABELS: Record<string, string> = {
  ...CODE_VERDICT_LABELS,
  PENDING: "Đang chấm",
  SYSTEM_ERROR: "Lỗi hệ thống",
};

const submittedAt = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Lịch sử nộp bài của người học cho một bài tập code; mỗi dòng mở lại được mã đã nộp. */
export function LessonCodeHistory({
  items,
  loading,
  failed,
  disabled,
  onOpen,
}: {
  items: LessonCodeHistoryItem[];
  loading: boolean;
  failed: boolean;
  disabled: boolean;
  onOpen: (item: LessonCodeHistoryItem) => void;
}) {
  return (
    <section aria-label="Lịch sử nộp bài" className="border-t pt-3">
      <h2 className="mb-2 text-sm font-semibold">Lịch sử nộp bài</h2>
      {loading ? (
        <p className="text-xs text-muted-foreground">Đang tải lịch sử nộp bài…</p>
      ) : failed ? (
        <p className="text-xs text-red-700">Không tải được lịch sử nộp bài.</p>
      ) : !items.length ? (
        <p className="text-xs text-muted-foreground">Chưa có bài nộp nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="code-history-table">
            <thead>
              <tr>
                <th>KẾT QUẢ</th>
                <th>ĐIỂM</th>
                <th>THỜI GIAN</th>
                <th>NỘP LÚC</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className={item.status === "ACCEPTED" ? "text-emerald-600" : "text-red-500"}>
                    {HISTORY_VERDICT_LABELS[item.status] ?? item.status}
                  </td>
                  <td className="font-semibold">{item.score}/100</td>
                  <td>{item.execution_time_ms == null ? "–" : `${item.execution_time_ms} ms`}</td>
                  <td>
                    <time dateTime={item.created_at}>
                      {submittedAt.format(new Date(item.created_at))}
                    </time>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="whitespace-nowrap text-emerald-700 hover:underline disabled:opacity-50"
                      disabled={disabled}
                      aria-label={`Mở lại mã bài nộp ${item.language} lúc ${submittedAt.format(new Date(item.created_at))}`}
                      onClick={() => onOpen(item)}
                    >
                      Mở lại mã
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
