/**
 * Review PR #79 (W9): gọi nhầm endpoint rút/gửi duyệt thì các test UI (đều mock service) vẫn xanh.
 * Ghim đúng đường dẫn backend của từng thao tác.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { courseApprovalService } from "@/services/course-approval.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

describe("courseApprovalService", () => {
  beforeEach(() => resetMockApi());

  it("withdrawReview -> POST /courses/:id/withdraw-review và trả data", async () => {
    mockApi.post.mockResolvedValue(envelope({ id: "c1", status: "draft" }));
    await expect(courseApprovalService.withdrawReview("c1")).resolves.toEqual({ id: "c1", status: "draft" });
    expect(mockApi.post).toHaveBeenCalledTimes(1);
    expect(mockApi.post.mock.calls[0][0]).toBe("/courses/c1/withdraw-review");
  });

  it("submitReview -> POST /courses/:id/submit-review", async () => {
    mockApi.post.mockResolvedValue(envelope({ id: "c1", status: "pending_review" }));
    await courseApprovalService.submitReview("c1");
    expect(mockApi.post.mock.calls[0][0]).toBe("/courses/c1/submit-review");
  });
});
