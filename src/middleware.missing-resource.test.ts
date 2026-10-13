/** F-08: middleware phải rewrite sang route 404 khi tài nguyên không tồn tại, và không đụng tới redirect /login. */
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/missing-resource-probe", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/missing-resource-probe")>()),
  isMissingResource: vi.fn(),
}));

import { isMissingResource, MISSING_RESOURCE_REWRITE_PATH } from "@/lib/missing-resource-probe";
import { middleware } from "./middleware";

const mockProbe = vi.mocked(isMissingResource);

function request(path: string, cookie?: string) {
  return new NextRequest(new URL(path, "http://localhost:3000"), cookie ? { headers: { cookie } } : undefined);
}

beforeEach(() => mockProbe.mockReset());

describe("middleware — 404 thật cho tài nguyên không tồn tại", () => {
  it("tài nguyên thiếu -> rewrite sang route 404", async () => {
    mockProbe.mockResolvedValue(true);
    const res = await middleware(request("/courses/khong-co"));
    expect(res.headers.get("x-middleware-rewrite")).toBe(
      new URL(MISSING_RESOURCE_REWRITE_PATH, "http://localhost:3000").toString()
    );
  });

  it("tài nguyên có thật -> cho qua", async () => {
    mockProbe.mockResolvedValue(false);
    const res = await middleware(request("/courses/co"));
    expect(res.headers.get("x-middleware-rewrite")).toBeNull();
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("chưa đăng nhập vào trang bảo vệ -> vẫn redirect /login, không dò backend", async () => {
    mockProbe.mockResolvedValue(true);
    const res = await middleware(request("/quizzes/abc"));
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/login");
    expect(mockProbe).not.toHaveBeenCalled();
  });
});
