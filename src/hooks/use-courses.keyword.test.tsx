import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getCoursesMock = vi.fn();
vi.mock("@/services/course.service", () => ({
  courseService: { getCourses: (...args: unknown[]) => getCoursesMock(...args) },
}));

// eslint-disable-next-line import/first
import { useCourses } from "./use-courses";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("useCourses — keyword (F-07)", () => {
  beforeEach(() => {
    getCoursesMock.mockReset();
    getCoursesMock.mockResolvedValue({ courses: [], total: 0 });
  });

  it("gửi keyword lên backend để tìm không phân biệt dấu", async () => {
    const { result } = renderHook(() => useCourses({ keyword: "dai so" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCoursesMock).toHaveBeenCalledWith({ keyword: "dai so" });
  });

  it("không có keyword thì gọi như cũ, không gửi tham số", async () => {
    const { result } = renderHook(() => useCourses({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getCoursesMock).toHaveBeenCalledWith(undefined);
  });
});
