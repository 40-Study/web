/** Q5-PG-06: /login?error=... (OAuth thất bại) từng im lặng hoàn toàn. */
import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError, success: vi.fn(), info: vi.fn() } }));
vi.mock("@/hooks/queries/use-auth", () => ({ useLogin: () => ({ mutate: vi.fn(), isPending: false }) }));
const params = vi.hoisted(() => ({ current: new URLSearchParams() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => params.current,
}));

import LoginPage from "./page";

beforeEach(() => {
  toastError.mockReset();
  window.history.replaceState(null, "", "/login");
});

describe("LoginPage — ?error=", () => {
  it("báo bằng tiếng Việt một lần và bỏ tham số error khỏi URL", () => {
    params.current = new URLSearchParams("error=access_denied&redirect=/courses");
    window.history.replaceState(null, "", "/login?error=access_denied&redirect=/courses");
    render(<LoginPage />);
    expect(toastError).toHaveBeenCalledTimes(1);
    expect(toastError.mock.calls[0][0]).toMatch(/từ chối/);
    expect(window.location.search).toBe("?redirect=%2Fcourses");
  });

  it("không có error: không toast", () => {
    params.current = new URLSearchParams();
    render(<LoginPage />);
    expect(toastError).not.toHaveBeenCalled();
  });

  it("chuỗi tiếng Anh lạ không bị in lại nguyên văn", () => {
    params.current = new URLSearchParams("error=Some%20raw%20english%20failure");
    render(<LoginPage />);
    expect(String(toastError.mock.calls[0][0])).not.toMatch(/raw english/);
  });
});
