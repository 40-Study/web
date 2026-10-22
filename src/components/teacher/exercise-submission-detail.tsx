"use client";

import { ChevronLeft, EyeOff, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ExerciseSubmissionRecord, TestCase } from "@/services/exercise.service";
import {
  formatSubmittedAt,
  studentName,
  submissionScore,
  verdictLabel,
  verdictTone,
} from "./exercise-submission-format";

interface ExerciseSubmissionDetailProps {
  submission: ExerciseSubmissionRecord;
  /** Bộ test hiện tại của bài, gồm test ẩn (giảng viên quản lý bài mới nhận được). */
  testCases: TestCase[];
  /** Bộ test đang tải: không hiện "(0)" như thể bài không có test. */
  testCasesLoading?: boolean;
  onBack: () => void;
}

/**
 * Chi tiết một bài nộp cho giảng viên: mã nguồn, kết quả, lỗi, và bộ test của bài (kể cả test ẩn).
 * Backend chỉ lưu tổng số test đạt cho mỗi bài nộp, không lưu kết quả từng test, nên phần test là
 * bộ test HIỆN TẠI của bài — có ghi rõ để giảng viên không hiểu nhầm là kết quả từng test.
 */
export function ExerciseSubmissionDetail({ submission, testCases, testCasesLoading = false, onBack }: ExerciseSubmissionDetailProps) {
  const sorted = [...testCases].sort((a, b) => a.display_order - b.display_order);
  return (
    <div className="space-y-4" data-testid="exercise-submission-detail">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ChevronLeft className="w-4 h-4 mr-1" /> Danh sách bài nộp
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{studentName(submission)}</p>
          {submission.student?.email && (
            <p className="text-xs text-muted-foreground truncate">{submission.student.email}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Nộp lúc {formatSubmittedAt(submission.created_at)} · {submission.language}
          </p>
        </div>
        <div className="text-right">
          <Badge variant={verdictTone(submission.verdict)}>{verdictLabel(submission.verdict)}</Badge>
          <p className="mt-1 text-xs text-muted-foreground">
            {submission.test_cases_passed}/{submission.total_test_cases} test đạt · {submissionScore(submission)}/100 điểm
            {submission.execution_time_ms != null ? ` · ${submission.execution_time_ms} ms` : ""}
            {submission.memory_used_kb != null ? ` · ${submission.memory_used_kb} KB` : ""}
          </p>
        </div>
      </div>

      {submission.error_message && (
        <div>
          <p className="text-sm font-medium mb-1">Thông báo lỗi</p>
          <pre className="max-h-40 overflow-auto rounded-lg bg-red-50 p-3 text-xs text-red-700 whitespace-pre-wrap">
            {submission.error_message}
          </pre>
        </div>
      )}

      <div>
        <p className="text-sm font-medium mb-1">Mã nguồn</p>
        <pre
          aria-label="Mã nguồn bài nộp"
          className="max-h-80 overflow-auto rounded-lg bg-gray-950 p-3 font-mono text-xs text-gray-100"
        >
          {submission.code}
        </pre>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Bộ test của bài{testCasesLoading ? "" : ` (${sorted.length})`}</p>
        <p className="text-xs text-muted-foreground">
          Hệ thống chỉ lưu số test đạt của mỗi bài nộp, chưa lưu kết quả từng test. Đây là bộ test hiện tại của
          bài, gồm cả test ẩn.
        </p>
        {testCasesLoading && (
          <p className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="submission-tests-loading">
            <Loader2 className="h-3 w-3 animate-spin" /> Đang tải bộ test…
          </p>
        )}
        {sorted.map((tc, idx) => (
          <div key={tc.id} className="rounded-lg border p-2 text-xs space-y-1" data-testid={`submission-test-${idx}`}>
            <div className="flex items-center gap-2 font-medium">
              Test #{idx + 1}
              {tc.is_hidden && (
                <Badge variant="secondary" size="sm">
                  <EyeOff className="w-3 h-3 mr-1" /> Ẩn
                </Badge>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <pre className="overflow-auto rounded bg-gray-50 p-2 whitespace-pre-wrap">{tc.input || "(trống)"}</pre>
              <pre className="overflow-auto rounded bg-gray-50 p-2 whitespace-pre-wrap">{tc.expected_output}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
