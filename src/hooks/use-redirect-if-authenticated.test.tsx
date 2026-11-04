import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { useRedirectIfAuthenticated } from "./use-redirect-if-authenticated";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));

function setSession(sessionStatus: "checking" | "authenticated" | "anonymous", activeRole: string | null = null) {
  useAuthStore.setState({ sessionStatus, isAuthenticated: sessionStatus === "authenticated", activeRole });
}

describe("useRedirectIfAuthenticated (A-01)", () => {
  beforeEach(() => {
    replace.mockClear();
    setSession("checking");
  });

  it("redirects an already-authenticated visitor to their role home", () => {
    setSession("authenticated", "PARENT");
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    expect(replace).toHaveBeenCalledWith("/home");
    expect(result.current).toBe(true);
  });

  it("waits while the session is still being checked, then redirects once it resolves", () => {
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    expect(replace).not.toHaveBeenCalled();
    act(() => setSession("authenticated", "SYSTEM_ADMIN"));
    expect(replace).toHaveBeenCalledTimes(1);
    expect(result.current).toBe(true);
  });

  it("leaves a guest alone and does not hijack a login that completes on the page", () => {
    setSession("anonymous");
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    act(() => setSession("authenticated", "STUDENT"));
    expect(replace).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });
});
