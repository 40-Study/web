/**
 * Bảng id đáp án → chữ đáp án, dựng từ đề (`/quizzes/:id/questions` hoặc phản hồi bắt đầu lượt làm).
 * Chỉ chứa chữ, không chứa `is_correct`, nên an toàn cho học viên.
 */
export function buildAnswerTextMap(
  questions: ReadonlyArray<{ answers: ReadonlyArray<{ id?: string; answer_text: string }> }> | undefined
): Map<string, string> {
  const map = new Map<string, string>();
  for (const q of questions ?? []) {
    for (const a of q.answers) {
      if (a.id) map.set(a.id, a.answer_text);
    }
  }
  return map;
}
