/**
 * QA ce-main-261021 F7/#2: sửa bộ test + giới hạn của bài code đã tạo. Kế hoạch lưu chỉ chứa phần đổi;
 * áp dụng theo thứ tự giới hạn -> sửa -> thêm -> xoá qua đúng endpoint.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { applyExerciseEditPlan, buildExerciseEditPlan, draftsFromTestCases } from "./exercise-edit-plan";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";
import type { TestCase } from "@/services/exercise.service";

const exercise = { time_limit: 2, memory_limit: 256, pass_percentage: 100 };
const saved: TestCase[] = [
  { id: "t2", exercise_id: "ex", input: "3", expected_output: "9", is_hidden: true, display_order: 7 },
  { id: "t1", exercise_id: "ex", input: "2", expected_output: "4", is_hidden: false, display_order: 3 },
];

describe("buildExerciseEditPlan", () => {
  it("không đổi gì (kể cả display_order cũ không đánh số 0..n-1) -> null", () => {
    expect(buildExerciseEditPlan({ exercise, testCases: saved }, draftsFromTestCases(saved), null)).toBeNull();
  });

  it("nạp theo display_order và giữ test ẩn kèm kết quả mong đợi", () => {
    const drafts = draftsFromTestCases(saved);
    expect(drafts.map((d) => [d.serverId, d.output, d.hidden])).toEqual([
      ["t1", "4", false],
      ["t2", "9", true],
    ]);
  });

  it("sửa / thêm / xoá test và đổi giới hạn -> đúng từng nhóm, body đầy đủ", () => {
    const [first] = draftsFromTestCases(saved);
    const drafts = [
      { ...first, output: "4\n", hidden: true },
      { id: "new", input: "5", output: "25", hidden: false },
    ];
    const plan = buildExerciseEditPlan({ exercise, testCases: saved }, drafts, {
      time_limit: 5,
      memory_limit: 256,
      pass_percentage: 80,
    });
    expect(plan).toEqual({
      exerciseUpdate: { time_limit: 5, pass_percentage: 80 },
      updates: [{ id: "t1", body: { input: "2", expected_output: "4\n", is_hidden: true, display_order: 0 } }],
      creates: [{ input: "5", expected_output: "25", is_hidden: false, display_order: 1 }],
      deletes: ["t2"],
    });
  });

  it("chỉ đổi thứ tự -> PUT cả hai test với display_order mới", () => {
    const drafts = draftsFromTestCases(saved).reverse();
    const plan = buildExerciseEditPlan({ exercise, testCases: saved }, drafts, null);
    expect(plan?.updates.map((u) => [u.id, u.body.display_order])).toEqual([
      ["t2", 0],
      ["t1", 1],
    ]);
  });
});

describe("applyExerciseEditPlan", () => {
  beforeEach(() => resetMockApi());

  it("gọi PUT exercise, PUT test, POST test, DELETE test — xoá sau cùng", async () => {
    const calls: string[] = [];
    for (const method of ["put", "post", "delete"] as const) {
      mockApi[method].mockImplementation(async (url: string) => {
        calls.push(`${method.toUpperCase()} ${url}`);
        return envelope({});
      });
    }
    await applyExerciseEditPlan("ex", {
      exerciseUpdate: { time_limit: 5 },
      updates: [{ id: "t1", body: { input: "2", expected_output: "4", is_hidden: false, display_order: 0 } }],
      creates: [{ input: "5", expected_output: "25", is_hidden: true, display_order: 1 }],
      deletes: ["t2"],
    });
    expect(calls).toEqual([
      "PUT /exercises/ex",
      "PUT /exercises/ex/testcases/t1",
      "POST /exercises/ex/testcases",
      "DELETE /exercises/ex/testcases/t2",
    ]);
    expect(mockApi.put).toHaveBeenCalledWith("/exercises/ex", { time_limit: 5 });
    expect(mockApi.put).toHaveBeenCalledWith("/exercises/ex/testcases/t1", {
      input: "2",
      expected_output: "4",
      is_hidden: false,
      display_order: 0,
    });
  });

  it("một bước lỗi -> ném lỗi và KHÔNG xoá test nào", async () => {
    mockApi.put.mockRejectedValue(new Error("404"));
    await expect(
      applyExerciseEditPlan("ex", {
        exerciseUpdate: null,
        updates: [{ id: "t1", body: { input: "2", expected_output: "4", is_hidden: false, display_order: 0 } }],
        creates: [],
        deletes: ["t2"],
      }),
    ).rejects.toThrow("404");
    expect(mockApi.delete).not.toHaveBeenCalled();
  });
});
