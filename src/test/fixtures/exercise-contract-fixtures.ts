/**
 * Fixture dùng chung cho các lane web của code editor: MỘT payload cho mỗi response của contract sec. 4
 * (plans/261015-student-code-editor/contract.md), đúng tập key mà backend khoá trong
 * internal/service/exercise_contract_test.go. Lane mock API bằng các fixture này thay vì tự chế payload.
 * Envelope: `/exercises*` và `/code-drafts*` bọc `{message, data}` (dùng `envelope()` của `@/test/mock-api`);
 * `/submissions/*` trả payload thô.
 */

import {
  CODE_EDITOR_ERROR_CODES,
  type CodeEditorErrorBody,
  type CodeEditorErrorCode,
} from "@/lib/code-editor-error-messages";
import type { CodeDraft, CodeDraftSummary } from "@/services/code-draft.service";
import type {
  ExerciseDetail,
  ExerciseSubmission,
  ExerciseSubmissionDetail,
  ExerciseSubmissionList,
  TestCase,
} from "@/services/exercise.service";
import type { ExecuteResult, RunnableLanguageOption } from "@/services/submission.service";

export const EXERCISE_ID = "6f1c2a10-0000-4000-8000-000000000001";
export const STUDENT_ID = "6f1c2a10-0000-4000-8000-0000000000aa";
export const SUBMISSION_ID = "6f1c2a10-0000-4000-8000-0000000000b1";
const TC_VISIBLE = "6f1c2a10-0000-4000-8000-0000000000c1";
const TC_HIDDEN = "6f1c2a10-0000-4000-8000-0000000000c2";
const CREATED_AT = "2026-10-15T09:00:00+07:00";

/** E1 POST /submissions/execute — payload thô */
export const executeResultFixture: ExecuteResult = {
  stdout: "3\n",
  stderr: "",
  compile_output: "",
  error: "",
  exit_code: 0,
  time: "0.012",
  memory: 3200,
  status: "accepted",
  status_id: 3,
};

/** E2 GET /submissions/languages — payload thô, thứ tự hiển thị */
export const runnableLanguagesFixture: RunnableLanguageOption[] = [
  { key: "python", label: "Python 3" },
  { key: "javascript", label: "JavaScript (Node.js)" },
  { key: "cpp", label: "C++ (GCC)" },
  { key: "c", label: "C (GCC)" },
  { key: "java", label: "Java" },
  { key: "sql", label: "SQL (SQLite)" },
];

/** E8 GET /exercises/:id/testcases (học viên: chỉ ca hiện) */
export const testCasesFixture: TestCase[] = [
  { id: TC_VISIBLE, exercise_id: EXERCISE_ID, input: "1 2", expected_output: "3", is_hidden: false, display_order: 0 },
];

/** E3 GET /exercises/:id */
export const exerciseDetailFixture: ExerciseDetail = {
  id: EXERCISE_ID,
  title: "Tổng hai số",
  description: "Đọc hai số nguyên a, b và in ra a + b.",
  difficulty: "easy",
  language: ["python", "cpp"],
  starter_code: "a, b = map(int, input().split())\n",
  time_limit: 2,
  memory_limit: 256,
  pass_percentage: 100,
  test_case_count: 2,
  created_at: CREATED_AT,
  updated_at: CREATED_AT,
  test_cases: testCasesFixture,
};

/** E4 POST /exercises/:id/submit — 201, verdict pending */
export const submitResponseFixture: ExerciseSubmission = {
  id: SUBMISSION_ID,
  exercise_id: EXERCISE_ID,
  user_id: STUDENT_ID,
  language: "python",
  code: "a, b = map(int, input().split())\nprint(a + b)\n",
  verdict: "pending",
  test_cases_passed: 0,
  total_test_cases: 2,
  execution_time_ms: 0,
  memory_used_kb: 0,
  error_message: "",
  created_at: CREATED_AT,
};

const gradedSubmission: ExerciseSubmission = {
  ...submitResponseFixture,
  verdict: "wrong_answer",
  test_cases_passed: 1,
  execution_time_ms: 24,
  memory_used_kb: 3200,
};

/** E5 GET /exercises/:id/my-submissions */
export const mySubmissionsFixture: ExerciseSubmissionList = {
  data: [gradedSubmission],
  total: 1,
  page: 1,
  page_size: 20,
};

/** E6 GET /exercises/:id/submissions/:sid — góc nhìn học viên: ca ẩn đã lược, ca thứ ba đã bị xoá */
export const submissionDetailFixture: ExerciseSubmissionDetail = {
  ...gradedSubmission,
  results: [
    {
      test_case_id: TC_VISIBLE,
      display_order: 0,
      is_hidden: false,
      verdict: "accepted",
      input: "1 2",
      expected_output: "3",
      actual_output: "3\n",
      error_output: "",
      execution_time_ms: 12,
      memory_used_kb: 3200,
    },
    { test_case_id: TC_HIDDEN, display_order: 1, is_hidden: true, verdict: "wrong_answer", execution_time_ms: 12, memory_used_kb: 3100 },
    { test_case_id: null, display_order: 2, is_hidden: false, verdict: "accepted" },
  ],
};

/** E7 GET /exercises/:id/submissions — người quản lý, mỗi dòng có `user` */
export const teacherSubmissionsFixture: ExerciseSubmissionList = {
  data: [{ ...gradedSubmission, user: { id: STUDENT_ID, user_name: "hocvien01", full_name: "Nguyễn Văn A" } }],
  total: 1,
  page: 1,
  page_size: 20,
};

/** E9 POST /exercises/:id/testcases — 201 */
export const createdTestCaseFixture: TestCase = {
  id: TC_HIDDEN,
  exercise_id: EXERCISE_ID,
  input: "5 7",
  expected_output: "12",
  is_hidden: true,
  display_order: 1,
};

/** E10 PUT /exercises/:id/testcases/:tcid */
export const updatedTestCaseFixture: TestCase = { ...createdTestCaseFixture, is_hidden: false };

/** E11 DELETE /exercises/:id/testcases/:tcid — chỉ `{message}`, không có data */
export const deleteTestCaseFixture = { message: "Test case deleted successfully" };

/** E12 GET /code-drafts?scope= (và E13 PUT trả cùng dạng) */
export const codeDraftFixture: CodeDraft = {
  scope: `exercise:${EXERCISE_ID}`,
  language: "python",
  code: "a, b = map(int, input().split())\n",
  updated_at: CREATED_AT,
};

/** E14 GET /code-drafts/list?prefix=sandbox: */
export const codeDraftListFixture: CodeDraftSummary[] = [
  { scope: "sandbox:main.py", language: "python", size: 42, updated_at: CREATED_AT },
  { scope: "sandbox:src/util.js", language: "javascript", size: 120, updated_at: CREATED_AT },
];

/** E15 DELETE /code-drafts */
export const codeDraftDeleteFixture = { deleted: 2 };

/**
 * Body lỗi theo contract sec. 1, một cho mỗi code. `message` chép NGUYÊN VĂN từ backend
 * (`internal/handler/code_editor_error_response.go`), không lấy từ `CODE_EDITOR_ERROR_MESSAGES`, để test bắt được
 * khi bảng phía web lệch khỏi backend.
 */
const backendErrorMessages: Record<CodeEditorErrorCode, string> = {
  UNSUPPORTED_LANGUAGE: "Ngôn ngữ lập trình này không được hỗ trợ.",
  NO_TEST_CASES: "Bài tập chưa có test case nào để chấm.",
  INVALID_SCOPE: "Đường dẫn bản nháp không hợp lệ.",
  DRAFT_LIMIT_REACHED: "Bạn đã có quá nhiều bản nháp, hãy xoá bớt bản nháp cũ rồi thử lại.",
  CODE_TOO_LARGE: "Mã nguồn vượt quá giới hạn 64 KB.",
  JUDGE_UNAVAILABLE: "Máy chấm tạm thời không khả dụng, vui lòng thử lại sau.",
  INTERNAL_ERROR: "Đã có lỗi xảy ra, vui lòng thử lại sau.",
};

export const codeEditorErrorFixtures = Object.fromEntries(
  CODE_EDITOR_ERROR_CODES.map((code) => [code, { code, error: code.toLowerCase(), message: backendErrorMessages[code] }])
) as Record<CodeEditorErrorCode, CodeEditorErrorBody>;
