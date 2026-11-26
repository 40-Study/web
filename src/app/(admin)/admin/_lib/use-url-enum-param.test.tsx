/** QA8-A11: bộ lọc trạng thái đồng bộ với URL (đọc từ URL, ghi bằng replace, mặc định thì bỏ khỏi URL). */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let search = "";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/admin/courses",
  useSearchParams: () => new URLSearchParams(search),
}));

import { parseEnumParam, useUrlEnumParam } from "./use-url-enum-param";

const STATUSES = ["pending_review", "published", "rejected"] as const;

beforeEach(() => {
  replace.mockReset();
  search = "";
});

describe("parseEnumParam", () => {
  it("giá trị hợp lệ được giữ, thiếu hoặc lạ rơi về mặc định", () => {
    expect(parseEnumParam("published", STATUSES, "pending_review")).toBe("published");
    expect(parseEnumParam(null, STATUSES, "pending_review")).toBe("pending_review");
    expect(parseEnumParam("hack", STATUSES, "pending_review")).toBe("pending_review");
  });
});

describe("useUrlEnumParam", () => {
  it("mở link ?status=published: đã lọc sẵn", () => {
    search = "status=published";
    const { result } = renderHook(() => useUrlEnumParam("status", STATUSES, "pending_review"));
    expect(result.current[0]).toBe("published");
  });

  it("đổi bộ lọc ghi lên URL bằng replace và giữ các tham số khác", () => {
    search = "keyword=abc";
    const { result } = renderHook(() => useUrlEnumParam("status", STATUSES, "pending_review"));
    act(() => result.current[1]("published"));
    expect(replace).toHaveBeenCalledWith("/admin/courses?keyword=abc&status=published", { scroll: false });
  });

  it("về giá trị mặc định thì bỏ tham số khỏi URL", () => {
    search = "status=published";
    const { result } = renderHook(() => useUrlEnumParam("status", STATUSES, "pending_review"));
    act(() => result.current[1]("pending_review"));
    expect(replace).toHaveBeenCalledWith("/admin/courses", { scroll: false });
  });
});
