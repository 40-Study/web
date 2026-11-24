/**
 * Màn làm bài: sau khi đã nộp, học viên vẫn sửa được rồi nộp lại (các nút Nộp bài không bị khoá), nhưng màn
 * không giữ bản nháp. Đóng màn lúc đang có thay đổi chưa nộp lại thì mất sạch (QA5 review #127, mục 1),
 * nên cần so nội dung hiện tại với nội dung của lần nộp/lần tải gần nhất.
 */

/** Nội dung của lần nộp (hoặc bài nộp tải về) gần nhất; trường `undefined` = chưa biết, không coi là đã sửa. */
export interface SavedContent {
  code?: string;
  essay?: string;
  /** `JSON.stringify(mcAnswers)` của lần nộp. */
  mc?: string;
}

export interface CurrentContent {
  type: 'code' | 'essay' | 'multiple_choice';
  code: string;
  essayAnswer: string;
  mcAnswers: number[];
}

export function hasUnsubmittedChanges(saved: SavedContent | null, current: CurrentContent): boolean {
  if (!saved) return false;
  switch (current.type) {
    case 'code':
      return saved.code !== undefined && current.code !== saved.code;
    case 'essay':
      return saved.essay !== undefined && current.essayAnswer !== saved.essay;
    case 'multiple_choice':
      // Trắc nghiệm tải lại luôn bắt đầu với mọi câu chưa chọn (-1): chọn bất kỳ câu nào là một thay đổi.
      return (
        current.mcAnswers.some((a) => a !== -1) &&
        (saved.mc === undefined || JSON.stringify(current.mcAnswers) !== saved.mc)
      );
  }
}

/** Nội dung của một bài nộp tải về từ `GET /submissions/my/:id` (`language: 'text'` = tự luận, `'json'` = trắc nghiệm). */
export function savedContentFromSubmission(sub: { language?: string; code?: string }): SavedContent {
  if (sub.language === 'json') return {};
  if (sub.language === 'text') return { essay: sub.code || undefined };
  return { code: sub.code || undefined };
}
