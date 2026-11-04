import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useFlowGuard } from "./use-flow-guard";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

describe("useFlowGuard (G-05)", () => {
  beforeEach(() => {
    replace.mockClear();
    sessionStorage.clear();
  });
  afterEach(() => sessionStorage.clear());

  it("redirects immediately with a message when a required key is missing", () => {
    const info = vi.spyOn(toast, "info").mockImplementation(() => "" as never);
    sessionStorage.setItem("a", "1");
    const { result } = renderHook(() => useFlowGuard(["a", "b"], "/register", "Bạn chưa đăng ký"));
    expect(replace).toHaveBeenCalledWith("/register");
    expect(info).toHaveBeenCalledWith("Bạn chưa đăng ký");
    expect(result.current).toBe(false);
  });

  it("shows the page when every key is present", () => {
    sessionStorage.setItem("a", "1");
    sessionStorage.setItem("b", "2");
    const { result } = renderHook(() => useFlowGuard(["a", "b"], "/register", "x"));
    expect(replace).not.toHaveBeenCalled();
    expect(result.current).toBe(true);
  });
});
