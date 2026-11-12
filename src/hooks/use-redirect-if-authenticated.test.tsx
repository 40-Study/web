import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/stores/auth.store";
import { useRedirectIfAuthenticated } from "./use-redirect-if-authenticated";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, push: vi.fn() }) }));
const bootstrapAuthSession = vi.fn();
vi.mock("@/components/providers/auth-session", () => ({ bootstrapAuthSession: () => bootstrapAuthSession() }));

function setSession(sessionStatus: "checking" | "authenticated" | "anonymous", activeRole: string | null = null) {
  useAuthStore.setState({ sessionStatus, isAuthenticated: sessionStatus === "authenticated", activeRole });
}

describe("useRedirectIfAuthenticated (A-01)", () => {
  beforeEach(() => {
    replace.mockClear();
    bootstrapAuthSession.mockReset().mockResolvedValue("authenticated");
    setSession("checking");
  });

  it("redirects an already-authenticated visitor to their role home (after the server confirms)", async () => {
    setSession("authenticated", "PARENT");
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    expect(result.current).toBe(true);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/home"));
    expect(result.current).toBe(true);
  });

  it("waits while the session is still being checked, then redirects once it resolves", async () => {
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    expect(replace).not.toHaveBeenCalled();
    act(() => setSession("authenticated", "SYSTEM_ADMIN"));
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(result.current).toBe(true);
  });

  it("leaves a guest alone and does not hijack a login that completes on the page", () => {
    setSession("anonymous");
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    act(() => setSession("authenticated", "STUDENT"));
    expect(replace).not.toHaveBeenCalled();
    expect(bootstrapAuthSession).not.toHaveBeenCalled();
    expect(result.current).toBe(false);
  });

  // UX-A-07: store còn "authenticated" nhưng cookie đã hết (middleware vừa đá về /login). Trước đây hook
  // đẩy tiếp về /home -> /login?redirect=/home, mất trang đang mở và không có form.
  it("stale 'authenticated' that the server rejects: shows the form, no bounce to role home", async () => {
    bootstrapAuthSession.mockImplementation(async () => {
      setSession("anonymous");
      return "anonymous";
    });
    setSession("authenticated", "STUDENT");
    const { result } = renderHook(() => useRedirectIfAuthenticated());

    await waitFor(() => expect(result.current).toBe(false));
    expect(bootstrapAuthSession).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it("server not answering yet ('checking'): keeps waiting, redirects once a later retry succeeds", async () => {
    bootstrapAuthSession.mockImplementation(async () => {
      setSession("checking", "STUDENT");
      return "checking";
    });
    setSession("authenticated", "STUDENT");
    const { result } = renderHook(() => useRedirectIfAuthenticated());
    await waitFor(() => expect(bootstrapAuthSession).toHaveBeenCalled());
    expect(result.current).toBe(true);
    expect(replace).not.toHaveBeenCalled();

    act(() => setSession("authenticated", "STUDENT"));
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/home"));
  });
});
