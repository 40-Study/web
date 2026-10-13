/**
 * QA2 Q2-03: backend có `POST /quizzes/:id/duplicate` nhưng web không có caller nào.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", async () => {
  const { mockApi } = await import("@/test/mock-api");
  return { api: mockApi };
});

import { quizService } from "@/services/quiz.service";
import { envelope, mockApi, resetMockApi } from "@/test/mock-api";

beforeEach(() => resetMockApi());

describe("quizService.duplicate", () => {
  it("POST /quizzes/:id/duplicate và trả quiz bản sao", async () => {
    mockApi.post.mockResolvedValue(envelope({ id: "q2", title: "Kiểm tra Git (Copy)", lesson_id: "les-1" }));

    const copy = await quizService.duplicate("q1");

    expect(mockApi.post).toHaveBeenCalledWith("/quizzes/q1/duplicate");
    expect(copy).toEqual({ id: "q2", title: "Kiểm tra Git (Copy)", lesson_id: "les-1" });
  });
});
