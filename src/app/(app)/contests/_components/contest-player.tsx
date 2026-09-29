"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubmitContest } from "@/hooks/queries/use-contests";
import {
  buildSubmitAnswers,
  clearAnswerDraft,
  isQuestionAnswered,
  loadAnswerDraft,
  saveAnswerDraft,
  type ContestAnswerMap,
} from "@/lib/contest/contest-answers";
import { contestPath } from "@/lib/contest/contest-cta";
import { contestErrorCode } from "@/lib/contest/contest-errors";
import { formatCountdown } from "@/lib/contest/contest-format";
import { cn } from "@/lib/utils";
import type { ContestDetail, ContestStartResult } from "@/types/contest";
import { ContestQuestion } from "./contest-question";
import { useServerCountdown } from "./use-server-countdown";

/** Dưới ngưỡng này đồng hồ chuyển đỏ để thí sinh biết sắp hết giờ. */
const WARNING_MS = 60_000;

export function ContestPlayer({ detail, session }: { detail: ContestDetail; session: ContestStartResult }) {
  const router = useRouter();
  const submit = useSubmitContest();
  const questions = [...session.questions].sort((a, b) => a.display_order - b.display_order);
  const [answers, setAnswers] = useState<ContestAnswerMap>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const submittedRef = useRef(false);

  // Khôi phục nháp của ĐÚNG attempt này (start trả lại attempt cũ khi tải lại trang).
  useEffect(() => {
    setAnswers(loadAnswerDraft(session.attempt_id));
  }, [session.attempt_id]);

  const updateAnswer = (questionId: string, draft: ContestAnswerMap[string]) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: draft };
      saveAnswerDraft(session.attempt_id, next);
      return next;
    });
  };

  const doSubmit = useCallback(
    (reason: "manual" | "timeout") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setConfirmOpen(false);
      submit.mutate(
        { contestId: detail.id, body: { attempt_id: session.attempt_id, answers: buildSubmitAnswers(questions, answers) } },
        {
          onSuccess: () => {
            clearAnswerDraft(session.attempt_id);
            toast.success(reason === "timeout" ? "Hết giờ, hệ thống đã tự nộp bài của bạn" : "Nộp bài thành công");
            router.replace(contestPath(detail.slug, "result"));
          },
          onError: (error) => {
            const code = contestErrorCode(error);
            // Đã nộp (tab khác) → xem kết quả. Quá hạn → về trang chi tiết (hiện "hết giờ").
            if (code === "CONTEST_ALREADY_SUBMITTED") router.replace(contestPath(detail.slug, "result"));
            else if (code === "CONTEST_DEADLINE_PASSED") router.replace(contestPath(detail.slug));
            else submittedRef.current = false; // lỗi mạng/khác: cho bấm nộp lại
          },
        }
      );
    },
    [answers, detail.id, detail.slug, questions, router, session.attempt_id, submit]
  );

  const remaining = useServerCountdown(session.deadline_at, session.server_time, () => doSubmit("timeout"));
  const answeredCount = questions.filter((q) => isQuestionAnswered(answers[q.id])).length;
  const isLocked = submit.isPending || submit.isSuccess;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-8 pt-4 sm:px-6">
      <div className="sticky top-0 z-20 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-b-xl">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{detail.title}</p>
          <p className="text-xs text-gray-500">
            Đã trả lời {answeredCount}/{questions.length} câu
          </p>
        </div>
        {/* Nút nộp nằm ở thanh dính PHÍA TRÊN, cạnh đồng hồ: đáy màn hình mobile đã có
            bottom-nav của app (fixed, z-50) đè lên mọi thanh cố định ở đáy (kiểm sống 390px). */}
        <div className="flex shrink-0 items-center gap-2">
          <p
            role="timer"
            aria-label="Thời gian còn lại"
            className={cn(
              "flex items-center gap-1 rounded-lg px-2 py-1.5 font-mono text-base font-bold sm:px-3 sm:text-lg",
              remaining !== null && remaining <= WARNING_MS ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-900"
            )}
          >
            <Clock className="h-4 w-4" aria-hidden="true" />
            {remaining === null ? "—" : formatCountdown(remaining)}
          </p>
          <Button size="sm" onClick={() => setConfirmOpen(true)} isLoading={submit.isPending} loadingText="Đang nộp…" disabled={isLocked}>
            <Send className="mr-1.5 h-4 w-4" aria-hidden="true" />
            Nộp bài
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-600">Đề thi chưa có câu hỏi.</p>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <ContestQuestion key={q.id} index={i} question={q} draft={answers[q.id]} disabled={isLocked} onChange={(d) => updateAnswer(q.id, d)} />
          ))}
        </div>
      )}

      <p className="mt-4 text-center text-xs text-gray-600">
        Bài được chấm ở máy chủ. Hết giờ hệ thống tự nộp. Đáp án công bố sau khi cuộc thi kết thúc.
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nộp bài thi?</DialogTitle>
            <DialogDescription>
              Bạn đã trả lời {answeredCount}/{questions.length} câu. Sau khi nộp không thể sửa, mỗi thí sinh chỉ nộp một lần.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Làm tiếp
            </Button>
            <Button onClick={() => doSubmit("manual")}>Nộp bài</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
