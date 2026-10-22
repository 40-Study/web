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

const normalized: TestCase[] = ["a", "b", "c", "d"].map((id, i) => ({
  id,
  exercise_id: "ex",
  input: id,
  expected_output: id.toUpperCase(),
  is_hidden: i === 3,
  display_order: i + 1,
}));

describe("buildExerciseEditPlan", () => {
  it("không đổi gì và display_order đã là 1..n -> null", () => {
    expect(buildExerciseEditPlan({ exercise, testCases: normalized }, draftsFromTestCases(normalized), null)).toBeNull();
  });

  it("display_order lưu không phải 1..n (số cũ rời rạc) -> đánh số lại 1..n", () => {
    const plan = buildExerciseEditPlan({ exercise, testCases: saved }, draftsFromTestCases(saved), null);
    expect(plan?.updates.map((u) => [u.id, u.body.display_order])).toEqual([
      ["t1", 1],
      ["t2", 2],
    ]);
  });

  it("dữ liệu 0-based (do bản web cũ ghi) -> đánh số lại 1..n", () => {
    const zeroBased = normalized.map((tc, i) => ({ ...tc, display_order: i }));
    const plan = buildExerciseEditPlan({ exercise, testCases: zeroBased }, draftsFromTestCases(zeroBased), null);
    expect(plan?.updates.map((u) => [u.id, u.body.display_order])).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
      ["d", 4],
    ]);
  });

  it("sửa test 2 và 3 của bài seed 1..4 -> thứ tự cuối cùng vẫn là 1,2,3,4, không trùng (QA ce-main-261022 P2)", () => {
    const drafts = draftsFromTestCases(normalized).map((d, i) => (i === 1 || i === 2 ? { ...d, output: `${d.output}!` } : d));
    const plan = buildExerciseEditPlan({ exercise, testCases: normalized }, drafts, null);
    const finalOrders = new Map(normalized.map((tc) => [tc.id, tc.display_order]));
    for (const { id, body } of plan?.updates ?? []) finalOrders.set(id, body.display_order);
    for (const body of plan?.creates ?? []) finalOrders.set(`new-${body.input}`, body.display_order);
    expect([...finalOrders.entries()].sort((x, y) => x[1] - y[1])).toEqual([["a", 1], ["b", 2], ["c", 3], ["d", 4]]);
    expect(plan?.updates.map((u) => u.id)).toEqual(["b", "c"]);
  });

  it("xoá giữa dãy -> các test còn lại được đánh số liền mạch, không để lỗ hổng/trùng", () => {
    const drafts = draftsFromTestCases(normalized).filter((d) => d.serverId !== "b");
    const plan = buildExerciseEditPlan({ exercise, testCases: normalized }, drafts, null);
    expect(plan?.updates.map((u) => [u.id, u.body.display_order])).toEqual([
      ["c", 2],
      ["d", 3],
    ]);
    expect(plan?.deletes).toEqual(["b"]);
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
      updates: [{ id: "t1", body: { input: "2", expected_output: "4\n", is_hidden: true, display_order: 1 } }],
      creates: [{ input: "5", expected_output: "25", is_hidden: false, display_order: 2 }],
      deletes: ["t2"],
    });
  });

  it("chỉ đổi thứ tự -> PUT cả hai test với display_order mới", () => {
    const drafts = draftsFromTestCases(saved).reverse();
    const plan = buildExerciseEditPlan({ exercise, testCases: saved }, drafts, null);
    expect(plan?.updates.map((u) => [u.id, u.body.display_order])).toEqual([
      ["t2", 1],
      ["t1", 2],
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
