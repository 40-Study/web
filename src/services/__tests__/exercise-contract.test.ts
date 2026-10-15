/**
 * Hợp đồng code editor phía web (plans/261015-student-code-editor/contract.md, sec. 1-5 và 9).
 * Mỗi hàm service gọi ĐÚNG method + path của sec. 4 và bóc envelope đúng (`/exercises*`, `/code-drafts*`:
 * `{message, data}` -> `r.data.data`; `/submissions/*`: payload thô -> `r.data`). Fixture có đúng tập key mà
 * backend khoá trong internal/service/exercise_contract_test.go; đổi một bên mà không đổi bên kia thì ĐỎ.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import {
  CODE_EDITOR_ERROR_CODES,
  CODE_EDITOR_ERROR_MESSAGES,
} from "@/lib/code-editor-error-messages";
import { getRunnableLanguage, RUNNABLE_LANGUAGES } from "@/lib/runnable-languages";
import { SUBMISSION_VERDICT_LABELS } from "@/lib/submission-verdict-labels";
import { codeDraftService } from "@/services/code-draft.service";
import {
  exerciseService,
  isTerminalVerdict,
  SUBMISSION_VERDICTS,
  SUBMISSION_POLL_MS,
  SUBMISSION_POLL_TIMEOUT_MS,
  TERMINAL_VERDICTS,
} from "@/services/exercise.service";
import { submissionService } from "@/services/submission.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import * as fx from "@/test/fixtures/exercise-contract-fixtures";

beforeEach(() => resetMockApi());

const sortedKeys = (o: object) => Object.keys(o).sort();
const keys = (...k: string[]) => [...k].sort();

const SUBMISSION_KEYS = [
  "id", "exercise_id", "user_id", "language", "code", "verdict", "test_cases_passed", "total_test_cases",
  "execution_time_ms", "memory_used_kb", "error_message", "created_at",
];

describe("fixture khớp tập key của contract sec. 4-5", () => {
  it("E1 execute: payload thô có compile_output, status (verdict), status_id", () => {
    expect(sortedKeys(fx.executeResultFixture)).toEqual(
      keys("stdout", "stderr", "compile_output", "error", "exit_code", "time", "memory", "status", "status_id"),
    );
  });

  it("E4/E5/E6/E7 bài nộp dùng verdict, không còn status/score", () => {
    expect(sortedKeys(fx.submitResponseFixture)).toEqual(keys(...SUBMISSION_KEYS));
    expect(fx.submitResponseFixture.verdict).toBe("pending");
    expect(sortedKeys(fx.mySubmissionsFixture)).toEqual(keys("data", "total", "page", "page_size"));
    expect(sortedKeys(fx.teacherSubmissionsFixture.data[0])).toEqual(keys(...SUBMISSION_KEYS, "user"));
    expect(sortedKeys(fx.teacherSubmissionsFixture.data[0].user!)).toEqual(keys("id", "user_name", "full_name"));
    expect(sortedKeys(fx.submissionDetailFixture)).toEqual(keys(...SUBMISSION_KEYS, "results"));
  });

  it("E6 kết quả: ca ẩn đã lược bỏ input/expected/actual/error, ca đã xoá có test_case_id null", () => {
    const [visible, hidden, deleted] = fx.submissionDetailFixture.results;
    expect(sortedKeys(visible)).toEqual(
      keys("test_case_id", "display_order", "is_hidden", "verdict", "input", "expected_output", "actual_output",
        "error_output", "execution_time_ms", "memory_used_kb"),
    );
    expect(hidden.is_hidden).toBe(true);
    for (const k of ["input", "expected_output", "actual_output", "error_output"]) {
      expect(hidden).not.toHaveProperty(k);
    }
    expect(deleted.test_case_id).toBeNull();
  });

  it("E12-E15 bản nháp", () => {
    expect(sortedKeys(fx.codeDraftFixture)).toEqual(keys("scope", "language", "code", "updated_at"));
    expect(sortedKeys(fx.codeDraftListFixture[0])).toEqual(keys("scope", "language", "size", "updated_at"));
    expect(fx.codeDraftDeleteFixture).toEqual({ deleted: expect.any(Number) });
  });

  it("lỗi: {code, error, message}, code UPPER_SNAKE, error là lower_snake của code", () => {
    for (const code of CODE_EDITOR_ERROR_CODES) {
      const body = fx.codeEditorErrorFixtures[code];
      expect(sortedKeys(body)).toEqual(keys("code", "error", "message"));
      expect(body.code).toBe(code);
      expect(body.error).toBe(code.toLowerCase());
    }
    expect(fx.codeEditorErrorFixtures.JUDGE_UNAVAILABLE.message).toBe(
      "Máy chấm tạm thời không khả dụng, vui lòng thử lại sau.",
    );
  });
});

describe("exerciseService gọi đúng endpoint và bóc envelope {message, data}", () => {
  it("E3 GET /exercises/:id", async () => {
    mockApi.get.mockResolvedValue(envelope(fx.exerciseDetailFixture));
    await expect(exerciseService.getById("ex-1")).resolves.toEqual(fx.exerciseDetailFixture);
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1");
  });

  it("E4 POST /exercises/:id/submit", async () => {
    mockApi.post.mockResolvedValue(envelope(fx.submitResponseFixture));
    const body = { language: "python", code: "print(3)" };
    await expect(exerciseService.submit("ex-1", body)).resolves.toEqual(fx.submitResponseFixture);
    expect(mockApi.post).toHaveBeenCalledWith("/exercises/ex-1/submit", body);
  });

  it("E5 GET /exercises/:id/my-submissions", async () => {
    mockApi.get.mockResolvedValue(envelope(fx.mySubmissionsFixture));
    await expect(exerciseService.getMySubmissions("ex-1", { page: 2, page_size: 10 })).resolves.toEqual(
      fx.mySubmissionsFixture,
    );
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/my-submissions", {
      params: { page: 2, page_size: 10 },
    });
  });

  it("E6 GET /exercises/:id/submissions/:submissionId", async () => {
    mockApi.get.mockResolvedValue(envelope(fx.submissionDetailFixture));
    await expect(exerciseService.getSubmissionDetail("ex-1", "sub-1")).resolves.toEqual(fx.submissionDetailFixture);
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/submissions/sub-1");
  });

  it("E7 GET /exercises/:id/submissions với user_id, trả {data,total,page,page_size}", async () => {
    mockApi.get.mockResolvedValue(envelope(fx.teacherSubmissionsFixture));
    const params = { page: 1, page_size: 20, user_id: "u-2" };
    await expect(exerciseService.getSubmissions("ex-1", params)).resolves.toEqual(fx.teacherSubmissionsFixture);
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/submissions", { params });
  });

  it("E8 GET, E9 POST, E10 PUT, E11 DELETE test case", async () => {
    mockApi.get.mockResolvedValue(envelope(fx.testCasesFixture));
    await expect(exerciseService.getTestCases("ex-1")).resolves.toEqual(fx.testCasesFixture);
    expect(mockApi.get).toHaveBeenCalledWith("/exercises/ex-1/testcases");

    const create = { input: "1 2", expected_output: "3", is_hidden: false, display_order: 0 };
    mockApi.post.mockResolvedValue(envelope(fx.createdTestCaseFixture));
    await expect(exerciseService.createTestCase("ex-1", create)).resolves.toEqual(fx.createdTestCaseFixture);
    expect(mockApi.post).toHaveBeenCalledWith("/exercises/ex-1/testcases", create);

    mockApi.put.mockResolvedValue(envelope(fx.updatedTestCaseFixture));
    await expect(exerciseService.updateTestCase("ex-1", "tc-1", { is_hidden: true })).resolves.toEqual(
      fx.updatedTestCaseFixture,
    );
    expect(mockApi.put).toHaveBeenCalledWith("/exercises/ex-1/testcases/tc-1", { is_hidden: true });

    mockApi.delete.mockResolvedValue({ data: fx.deleteTestCaseFixture });
    await expect(exerciseService.deleteTestCase("ex-1", "tc-1")).resolves.toEqual(fx.deleteTestCaseFixture);
    expect(mockApi.delete).toHaveBeenCalledWith("/exercises/ex-1/testcases/tc-1");
  });
});

describe("codeDraftService (E12-E15)", () => {
  it("E12 get: 200 với data null khi chưa có nháp", async () => {
    mockApi.get.mockResolvedValue(envelope(null));
    await expect(codeDraftService.get("exercise:ex-1")).resolves.toBeNull();
    expect(mockApi.get).toHaveBeenCalledWith("/code-drafts", { params: { scope: "exercise:ex-1" } });

    mockApi.get.mockResolvedValue(envelope(fx.codeDraftFixture));
    await expect(codeDraftService.get("exercise:ex-1")).resolves.toEqual(fx.codeDraftFixture);
  });

  it("E13 save là PUT upsert", async () => {
    mockApi.put.mockResolvedValue(envelope(fx.codeDraftFixture));
    const body = { scope: "sandbox:src/main.py", language: "python", code: "print(1)" };
    await expect(codeDraftService.save(body)).resolves.toEqual(fx.codeDraftFixture);
    expect(mockApi.put).toHaveBeenCalledWith("/code-drafts", body);
  });

  it("E14 list theo prefix", async () => {
    mockApi.get.mockResolvedValue(envelope(fx.codeDraftListFixture));
    await expect(codeDraftService.list("sandbox:")).resolves.toEqual(fx.codeDraftListFixture);
    expect(mockApi.get).toHaveBeenCalledWith("/code-drafts/list", { params: { prefix: "sandbox:" } });
  });

  it("E15 remove theo scope hoặc prefix", async () => {
    mockApi.delete.mockResolvedValue(envelope(fx.codeDraftDeleteFixture));
    await expect(codeDraftService.remove({ scope: "sandbox:a.py" })).resolves.toEqual(fx.codeDraftDeleteFixture);
    expect(mockApi.delete).toHaveBeenCalledWith("/code-drafts", { params: { scope: "sandbox:a.py" } });
    await codeDraftService.remove({ prefix: "sandbox:src/" });
    expect(mockApi.delete).toHaveBeenLastCalledWith("/code-drafts", { params: { prefix: "sandbox:src/" } });
  });
});

describe("submissionService code editor (E1, E2): payload thô, KHÔNG .data.data", () => {
  it("E1 POST /submissions/execute", async () => {
    mockApi.post.mockResolvedValue({ data: fx.executeResultFixture });
    const body = { language: "python", code: "print(3)", stdin: "" };
    await expect(submissionService.execute(body)).resolves.toEqual(fx.executeResultFixture);
    expect(mockApi.post).toHaveBeenCalledWith("/submissions/execute", body);
  });

  it("E2 GET /submissions/languages", async () => {
    mockApi.get.mockResolvedValue({ data: fx.runnableLanguagesFixture });
    await expect(submissionService.getRunnableLanguages()).resolves.toEqual(fx.runnableLanguagesFixture);
    expect(mockApi.get).toHaveBeenCalledWith("/submissions/languages");
  });
});

describe("bảng dùng chung cho WEB-A/B/C", () => {
  it("runnable-languages khớp E2 (đúng thứ tự, không có html)", () => {
    expect(RUNNABLE_LANGUAGES.map((l) => l.key)).toEqual(fx.runnableLanguagesFixture.map((l) => l.key));
    expect(RUNNABLE_LANGUAGES.map((l) => l.label)).toEqual(fx.runnableLanguagesFixture.map((l) => l.label));
    expect(RUNNABLE_LANGUAGES.some((l) => l.key === "html" || l.monacoLang === "html")).toBe(false);
    for (const l of RUNNABLE_LANGUAGES) {
      expect(l.ext).toMatch(/^\.[a-z]+$/);
      expect(l.boilerplate.trim()).not.toBe("");
    }
  });

  it("getRunnableLanguage chuẩn hoá alias như backend, khoá lạ trả undefined", () => {
    expect(getRunnableLanguage("python3")?.key).toBe("python");
    expect(getRunnableLanguage(" JS ")?.key).toBe("javascript");
    expect(getRunnableLanguage("c++")?.key).toBe("cpp");
    expect(getRunnableLanguage("html")).toBeUndefined();
    expect(getRunnableLanguage("typescript")).toBeUndefined();
  });

  it("mọi verdict có nhãn tiếng Việt; chỉ pending/running là chưa kết thúc", () => {
    expect([...SUBMISSION_VERDICTS].sort()).toEqual(
      keys("pending", "running", "accepted", "wrong_answer", "compilation_error", "runtime_error",
        "time_limit_exceeded", "memory_limit_exceeded", "system_error", "judge_unavailable"),
    );
    for (const v of SUBMISSION_VERDICTS) {
      expect(SUBMISSION_VERDICT_LABELS[v].label.trim()).not.toBe("");
      expect(isTerminalVerdict(v)).toBe(v !== "pending" && v !== "running");
    }
    expect(TERMINAL_VERDICTS).toHaveLength(8);
    expect(isTerminalVerdict("bogus")).toBe(false);
    expect(SUBMISSION_VERDICT_LABELS.judge_unavailable.label).toBe("Máy chấm tạm thời không khả dụng");
    expect(SUBMISSION_VERDICT_LABELS.accepted.tone).toBe("success");
  });

  it("thông báo lỗi cho mọi code, thời gian poll theo sec. 9", () => {
    for (const code of CODE_EDITOR_ERROR_CODES) {
      expect(CODE_EDITOR_ERROR_MESSAGES[code]).toBe(fx.codeEditorErrorFixtures[code].message);
    }
    expect(SUBMISSION_POLL_MS).toBe(2000);
    expect(SUBMISSION_POLL_TIMEOUT_MS).toBe(90000);
  });
});
