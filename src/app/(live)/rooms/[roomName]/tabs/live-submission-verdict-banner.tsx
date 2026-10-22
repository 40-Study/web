'use client';

/**
 * Kết quả bài nộp code ngay dưới editor: đang chấm, đã có verdict, hay máy chấm không sẵn sàng.
 */
import {
  JUDGE_UNAVAILABLE_SUBMIT_AGAIN_MESSAGE,
  isGradingVerdict,
  isJudgeUnavailableVerdict,
  submissionVerdictLabel,
} from '@/lib/live-submission-verdict';

interface Props {
  submission: {
    verdict?: unknown;
    test_cases_passed?: number;
    total_test_cases?: number;
  } | null;
  /** Hết thời gian hỏi trạng thái mà backend vẫn đang chấm. */
  timedOut: boolean;
}

const TONES = {
  neutral: { color: 'rgba(255,255,255,0.75)', background: 'rgba(255,255,255,0.05)' },
  success: { color: '#00c864', background: 'rgba(0,200,100,0.1)' },
  warning: { color: '#ffb020', background: 'rgba(255,176,32,0.1)' },
  danger: { color: '#ff6352', background: 'rgba(255,99,82,0.1)' },
} as const;

function describe(submission: NonNullable<Props['submission']>, timedOut: boolean): { text: string; tone: keyof typeof TONES } {
  const verdict = String(submission.verdict);
  if (isGradingVerdict(verdict)) {
    return timedOut
      ? { text: 'Đang chấm, kiểm tra lại sau.', tone: 'neutral' }
      : { text: 'Đang chấm bài...', tone: 'neutral' };
  }
  if (isJudgeUnavailableVerdict(verdict)) {
    return { text: JUDGE_UNAVAILABLE_SUBMIT_AGAIN_MESSAGE, tone: 'warning' };
  }
  const total = submission.total_test_cases ?? 0;
  const tests = total > 0 ? ` · ${submission.test_cases_passed ?? 0}/${total} test đạt` : '';
  return {
    text: `Kết quả: ${submissionVerdictLabel(verdict)}${tests}`,
    tone: verdict === 'accepted' ? 'success' : 'danger',
  };
}

export default function LiveSubmissionVerdictBanner({ submission, timedOut }: Props) {
  if (!submission || typeof submission.verdict !== 'string') return null;
  const { text, tone } = describe(submission, timedOut);
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="live-submission-verdict"
      style={{
        ...TONES[tone],
        borderTop: '1px solid rgba(255,255,255,0.07)',
        padding: '0.5rem 1rem',
        fontSize: '0.78rem',
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {text}
    </div>
  );
}
