/**
 * Mã lỗi của code editor (contract sec. 1) và câu tiếng Việt tương ứng — đúng nguyên văn `message` backend trả
 * (`handler/code_editor_error_response.go`). Cần ở web vì interceptor chung (`lib/api-client.ts`) thay message
 * của mọi lỗi 5xx (gồm 503 JUDGE_UNAVAILABLE) bằng câu chung: UI đọc `ApiError.code` rồi tra bảng này.
 */

export const CODE_EDITOR_ERROR_CODES = [
  "UNSUPPORTED_LANGUAGE",
  "NO_TEST_CASES",
  "INVALID_SCOPE",
  "DRAFT_LIMIT_REACHED",
  "CODE_TOO_LARGE",
  "JUDGE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type CodeEditorErrorCode = (typeof CODE_EDITOR_ERROR_CODES)[number];

/** Body lỗi của code editor: `error` là `code` viết thường. */
export interface CodeEditorErrorBody {
  code: CodeEditorErrorCode;
  error: string;
  message: string;
}

export const CODE_EDITOR_ERROR_MESSAGES: Record<CodeEditorErrorCode, string> = {
  UNSUPPORTED_LANGUAGE: "Ngôn ngữ lập trình này không được hỗ trợ.",
  NO_TEST_CASES: "Bài tập chưa có test case nào để chấm.",
  INVALID_SCOPE: "Đường dẫn bản nháp không hợp lệ.",
  DRAFT_LIMIT_REACHED: "Bạn đã có quá nhiều bản nháp, hãy xoá bớt bản nháp cũ rồi thử lại.",
  CODE_TOO_LARGE: "Mã nguồn vượt quá giới hạn 64 KB.",
  JUDGE_UNAVAILABLE: "Máy chấm tạm thời không khả dụng, vui lòng thử lại sau.",
  INTERNAL_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
};

/** Trạng thái người học có thể bấm thử lại (contract sec. 1, cột "Student can retry"). */
export const RETRYABLE_CODE_EDITOR_ERRORS: readonly CodeEditorErrorCode[] = ["JUDGE_UNAVAILABLE", "INTERNAL_ERROR"];
