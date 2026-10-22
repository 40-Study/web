'use client';

/**
 * Theo dõi một bài nộp code của bài tập live tới khi có verdict.
 *
 * Backend#138: POST /submissions trả 201 với dòng `pending`, việc chấm chạy nền. Màn làm bài phải
 * hỏi lại GET /submissions/:id tới khi verdict khác `pending`/`running`. Hết ~2 phút vẫn đang chấm
 * thì dừng hỏi và báo trạng thái trung tính (không phải lỗi): bài vẫn được chấm ở backend.
 */
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/meet/api';
import { isGradingVerdict } from '@/lib/live-submission-verdict';
import type { SubmissionResponseDTO } from '@/services/submission.service';

export const VERDICT_POLL_INTERVAL_MS = 1_500;
/** 80 lần x 1,5 s = 2 phút. */
export const VERDICT_POLL_MAX_ATTEMPTS = 80;

interface PolledSubmission {
  id?: string;
  verdict?: unknown;
}

export function useLiveSubmissionVerdictPoll(
  submission: PolledSubmission | null | undefined,
  onFinal: (submission: SubmissionResponseDTO) => void,
): { timedOut: boolean } {
  const id = submission?.id;
  const grading = !!id && isGradingVerdict(submission?.verdict);
  const [timedOutId, setTimedOutId] = useState<string | null>(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    if (!grading || !id) return;
    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      attempts += 1;
      try {
        const res = await api.get<{ data: SubmissionResponseDTO }>(`/submissions/${id}`);
        if (cancelled) return;
        if (res?.data && !isGradingVerdict(res.data.verdict)) {
          onFinalRef.current(res.data);
          return;
        }
      } catch {
        // Lỗi mạng/tạm thời khi hỏi trạng thái: hỏi lại ở lượt sau; hết hạn thì về trạng thái trung tính.
        if (cancelled) return;
      }
      if (attempts >= VERDICT_POLL_MAX_ATTEMPTS) {
        setTimedOutId(id);
        return;
      }
      timer = setTimeout(tick, VERDICT_POLL_INTERVAL_MS);
    };

    timer = setTimeout(tick, VERDICT_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, grading]);

  return { timedOut: grading && timedOutId === id };
}
