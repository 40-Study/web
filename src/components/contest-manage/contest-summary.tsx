"use client";

/** Tóm tắt một cuộc thi ở trang quản lý (giảng viên + admin). */

import { Badge } from "@/components/ui/badge";
import { formatVnDateTime } from "@/lib/contest-manage/format";
import { phaseLabel, phaseVariant } from "@/lib/contest-manage/labels";
import type { ContestManage, ContestPrizeAdmin } from "@/types/contest";

function prizeText(p: ContestPrizeAdmin): string {
  const ranks =
    p.rank_from === p.rank_to ? `Hạng ${p.rank_from}` : `Hạng ${p.rank_from}–${p.rank_to}`;
  const parts = [
    p.grant_certificate ? "chứng nhận" : null,
    p.voucher ? `voucher ${p.voucher.name} (${p.voucher.code})` : null,
  ]
    .filter(Boolean)
    .join(" + ");
  return `${ranks}: ${parts}`;
}

export function ContestSummary({ contest }: { contest: ContestManage }) {
  const rows: Array<[string, React.ReactNode]> = [
    [
      "Trạng thái",
      <Badge key="s" variant={phaseVariant(contest.phase)} data-testid="contest-phase">
        {phaseLabel(contest.phase)}
      </Badge>,
    ],
    ["Người tạo", `${contest.creator_name} (${contest.creator_email})`],
    [
      contest.type === "CODING" ? "Đề lập trình" : "Bài trắc nghiệm",
      contest.type === "CODING"
        ? `${contest.question_count} bài · ${contest.total_points} điểm · Judge0`
        : contest.quiz
          ? `${contest.quiz.title} · ${contest.quiz.question_count} câu · ${contest.total_points} điểm`
          : "—",
    ],
    ["Bắt đầu", formatVnDateTime(contest.start_time)],
    ["Kết thúc", formatVnDateTime(contest.end_time)],
    ["Thời lượng", `${contest.duration_minutes} phút`],
    [
      "Người tham gia",
      contest.max_participants > 0
        ? `${contest.participant_count}/${contest.max_participants}`
        : `${contest.participant_count} (không giới hạn)`,
    ],
    ["Hiển thị", contest.is_public ? "Công khai" : "Ẩn khỏi danh sách (vào bằng đường dẫn)"],
    [
      "Chứng nhận theo ngưỡng",
      contest.certificate_min_percentage === null
        ? "Không"
        : `Từ ${contest.certificate_min_percentage}%`,
    ],
  ];
  if (contest.submitted_at) rows.push(["Gửi duyệt lúc", formatVnDateTime(contest.submitted_at)]);
  if (contest.finalized_at) rows.push(["Chốt kết quả lúc", formatVnDateTime(contest.finalized_at)]);

  return (
    <section
      className="space-y-4 rounded-xl border bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
      data-testid="contest-summary"
    >
      {contest.status === "REJECTED" && contest.reject_reason && (
        <p
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
          data-testid="reject-reason"
        >
          Bị từ chối: {contest.reject_reason}
        </p>
      )}
      {contest.status === "CANCELLED" && contest.cancel_reason && (
        <p
          className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700 dark:bg-gray-800 dark:text-gray-200"
          data-testid="cancel-reason"
        >
          Đã huỷ: {contest.cancel_reason}
        </p>
      )}
      <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        ))}
      </dl>
      {contest.type === "CODING" &&
        (contest.problems ?? []).map((p, i) => (
          <details key={p.id} className="rounded-lg border p-3">
            <summary className="cursor-pointer text-sm font-semibold">
              Bài {i + 1}: {p.title} · {p.points} điểm · {p.time_limit_seconds}s ·{" "}
              {p.memory_limit_mb} MB
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-sm">{p.description}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(p.tests ?? p.samples).map((t, j) => (
                <div key={j} className="rounded-lg bg-muted p-3 text-xs">
                  <strong>
                    Test {j + 1} · {t.hidden ? "Ẩn" : "Mẫu"}
                  </strong>
                  <pre className="mt-2 whitespace-pre-wrap">
                    Input: {t.input}
                    {"\n"}Output: {t.expected_output}
                  </pre>
                </div>
              ))}
            </div>
          </details>
        ))}
      <div>
        <p className="text-xs text-gray-500">Giải thưởng</p>
        {contest.prizes.length === 0 ? (
          <p className="text-sm">Chưa có giải theo hạng.</p>
        ) : (
          <ul className="list-disc pl-5 text-sm" data-testid="prize-list">
            {contest.prizes.map((p) => (
              <li key={p.id}>{prizeText(p)}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
