/** Q10 #148 M3 / L2: gom nhiều query thành MỘT trạng thái "dữ liệu cũ"; danh sách rỗng đã cache vẫn là dữ liệu. */
import { describe, expect, it, vi } from "vitest";
import { hasCachedData, staleQueries } from "./stale-queries";

const query = (isError: boolean, data: unknown) => ({ isError, data, refetch: vi.fn(async () => "ok") });

describe("hasCachedData", () => {
  it("chỉ undefined là chưa có dữ liệu; [] / 0 / null đã cache vẫn là dữ liệu hợp lệ", () => {
    expect(hasCachedData(undefined)).toBe(false);
    expect(hasCachedData([])).toBe(true);
    expect(hasCachedData(0)).toBe(true);
    expect(hasCachedData(null)).toBe(true);
  });
});

describe("staleQueries", () => {
  it("không query nào lỗi: không cũ", () => {
    expect(staleQueries([query(false, [1]), query(false, undefined)]).isStale).toBe(false);
  });

  it("lỗi mà CHƯA có dữ liệu không phải 'cũ' (widget đó tự hiện hộp lỗi đầy đủ)", () => {
    expect(staleQueries([query(true, undefined)]).isStale).toBe(false);
  });

  it("lỗi mà còn dữ liệu (kể cả danh sách rỗng đã cache) là 'cũ'", () => {
    expect(staleQueries([query(true, [])]).isStale).toBe(true);
    expect(staleQueries([query(false, [1]), query(true, { a: 1 })]).isStale).toBe(true);
  });

  it("retry chỉ làm mới các query đang cũ và trả Promise (nút 'Thử lại' hiện trạng thái bận)", async () => {
    const stale = query(true, [1]);
    const healthy = query(false, [2]);
    const failedFirstLoad = query(true, undefined);
    const result = staleQueries([stale, healthy, failedFirstLoad]);
    const pending = result.retry();
    expect(pending).toBeInstanceOf(Promise);
    await pending;
    expect(stale.refetch).toHaveBeenCalledTimes(1);
    expect(healthy.refetch).not.toHaveBeenCalled();
    expect(failedFirstLoad.refetch).not.toHaveBeenCalled();
  });
});
