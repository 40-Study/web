"use client";

/**
 * Điểm của tôi (A-07): học viên xem điểm đã chấm, nhận xét và người chấm, nhóm theo lớp.
 * Dữ liệu từ GET /me/grades (backend đã trả `graded_by_name`, `class_name`); trước đây không trang nào gọi nó.
 */

import Link from "next/link";
import { ArrowLeft, GraduationCap, Loader2, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error-messages";
import { useMyGrades } from "@/hooks/queries/use-grades";
import { groupGradesByClass, scoreTone, type ScoreTone } from "@/lib/my-grades";

const TONE_CLASSES: Record<ScoreTone, string> = {
  good: "bg-green-50 text-green-700",
  ok: "bg-amber-50 text-amber-700",
  low: "bg-red-50 text-red-700",
};

function formatGradedAt(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function MyGradesPage() {
  const { data: grades, isLoading, error, refetch } = useMyGrades();
  const groups = groupGradesByClass(grades ?? []);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <Link
        href="/my-assignments"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
      >
        <ArrowLeft className="w-4 h-4" />
        Bài tập của tôi
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Điểm của tôi</h1>
        <p className="text-gray-500 mt-1">Điểm, nhận xét và người chấm cho các bài bạn đã làm.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : error ? (
        <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{getErrorMessage(error, "Không tải được điểm của bạn")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-red-700 border border-red-200 hover:bg-red-100"
          >
            Thử lại
          </button>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-gray-500 text-sm">Bạn chưa có điểm nào. Điểm sẽ hiện ở đây sau khi giảng viên chấm bài.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.classId}
              aria-label={group.className}
              className="rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <h2 className="border-b border-gray-100 px-5 py-3 font-semibold text-gray-900">
                {group.className}
              </h2>
              <ul className="divide-y divide-gray-100">
                {group.grades.map((g) => (
                  <li key={g.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-gray-900">{g.title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Chấm bởi {g.graded_by_name || "giảng viên"}
                        {formatGradedAt(g.graded_at) && ` · ${formatGradedAt(g.graded_at)}`}
                      </p>
                      {g.feedback && (
                        <p className="mt-2 flex gap-1.5 text-sm text-gray-600">
                          <MessageSquareText className="mt-0.5 w-4 h-4 shrink-0 text-gray-400" />
                          <span>{g.feedback}</span>
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "shrink-0 self-start rounded-lg px-3 py-1 text-sm font-semibold",
                        TONE_CLASSES[scoreTone(g.score, g.max_score)],
                      )}
                    >
                      {g.score}/{g.max_score}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
