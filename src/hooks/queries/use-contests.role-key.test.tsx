/** Round 2 (QA5 S5 item 6): `viewer` của chi tiết cuộc thi phụ thuộc người và VAI, nên đổi vai không dùng lại cache. */
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppQueryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";

const getBySlug = vi.fn();
vi.mock("@/services/contest.service", () => ({
  contestService: { getBySlug: (...a: unknown[]) => getBySlug(...a) },
}));

import { useContestDetail } from "./use-contests";

function setup() {
  const qc = createAppQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  return renderHook(() => useContestDetail("demo"), { wrapper });
}

beforeEach(() => {
  // Học viên tham gia được, giảng viên thì không: cùng slug, hai `viewer` khác nhau.
  getBySlug.mockReset().mockImplementation(() =>
    Promise.resolve({ viewer: { can_join: useAuthStore.getState().activeRole === "STUDENT" } }),
  );
  useAuthStore.setState({ hasHydrated: true, sessionStatus: "authenticated", activeRole: "STUDENT" });
});

describe("useContestDetail — khoá cache theo vai", () => {
  it("đổi vai STUDENT -> TEACHER: tải lại viewer, không dùng viewer cũ trong 30 s", async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toEqual({ viewer: { can_join: true } }));

    act(() => useAuthStore.setState({ activeRole: "TEACHER" }));
    await waitFor(() => expect(result.current.data).toEqual({ viewer: { can_join: false } }));
    expect(getBySlug).toHaveBeenCalledTimes(2);
  });

  it("đổi tài khoản cùng vai: cũng tải lại", async () => {
    useAuthStore.setState({ user: { id: "u1" } as never });
    const { result } = setup();
    await waitFor(() => expect(result.current.data).toBeTruthy());

    act(() => useAuthStore.setState({ user: { id: "u2" } as never }));
    await waitFor(() => expect(getBySlug).toHaveBeenCalledTimes(2));
  });
});
