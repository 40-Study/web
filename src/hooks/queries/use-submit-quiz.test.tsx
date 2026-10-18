import { ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { useSubmitQuiz } from "./use-quiz";
import { enrollmentKeys } from "./use-enrollments";
import { sectionKeys } from "./use-sections";
const submit = vi.hoisted(() => vi.fn());
vi.mock("@/services/quiz.service", () => ({ quizService: { submitQuiz: submit } }));
describe("quiz submission request ownership", () => {
  it("invalidates each progress query exactly once after success", async () => {
    submit.mockResolvedValue({ id: "attempt" });
    const client = new QueryClient();
    const invalidation = vi.spyOn(client, "invalidateQueries");
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useSubmitQuiz("course-1"), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ quizId: "quiz-1", data: { answers: [] } });
    });
    const keys = invalidation.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys.filter((k) => k === JSON.stringify(enrollmentKeys.all))).toHaveLength(1);
    expect(keys.filter((k) => k === JSON.stringify(sectionKeys.byCourse("course-1")))).toHaveLength(
      1
    );
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
