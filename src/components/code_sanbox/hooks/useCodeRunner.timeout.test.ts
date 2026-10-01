/**
 * L5: timeout của runJudge0 chạy THẬT (không mock runJudge0), chỉ mock `fetch` treo. Kiểm:
 * - `signal` được truyền cho fetch và huỷ nó thì ra kết quả lỗi id 13 (thông báo timeout), không phải Accepted;
 * - trình duyệt không có `AbortSignal.timeout` (Safari < 16, Chrome < 103) vẫn có timeout nhờ AbortController + setTimeout.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCodeRunner } from "./useCodeRunner";

const TIMEOUT_MS = 30_000;
const nativeTimeout = Object.getOwnPropertyDescriptor(AbortSignal, "timeout");

/** fetch treo: chỉ kết thúc (reject bằng `signal.reason`) khi signal bị huỷ. */
function stubHangingFetch() {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

const timeoutError = () => new DOMException("The operation timed out.", "TimeoutError");

describe("runJudge0 qua useCodeRunner — timeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    if (nativeTimeout) Object.defineProperty(AbortSignal, "timeout", nativeTimeout);
  });

  it("truyền AbortSignal (từ AbortSignal.timeout 30s) cho fetch; huỷ nó -> lỗi id 13, không Accepted", async () => {
    const controller = new AbortController();
    const timeoutSpy = vi.fn(() => controller.signal);
    Object.defineProperty(AbortSignal, "timeout", { value: timeoutSpy, configurable: true });
    const fetchMock = stubHangingFetch();

    const { result } = renderHook(() => useCodeRunner());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.runCode(71, "print(1)", "");
    });

    expect(timeoutSpy).toHaveBeenCalledWith(TIMEOUT_MS);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBe(controller.signal);
    expect(result.current.running).toBe(true);

    await act(async () => {
      controller.abort(timeoutError());
      await pending;
    });

    expect(result.current.running).toBe(false);
    expect(result.current.result?.status?.id).toBe(13);
    expect(result.current.result?.stderr).toMatch(/quá lâu/);
  });

  it("không có AbortSignal.timeout: AbortController + setTimeout vẫn huỷ fetch sau 30s", async () => {
    Object.defineProperty(AbortSignal, "timeout", { value: undefined, configurable: true });
    const fetchMock = stubHangingFetch();

    const { result } = renderHook(() => useCodeRunner());
    let pending!: Promise<void>;
    act(() => {
      pending = result.current.runCode(71, "print(1)", "");
    });
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(init.signal?.aborted).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1);
    });
    expect(init.signal?.aborted).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await pending;
    });
    expect(init.signal?.aborted).toBe(true);
    expect(result.current.result?.status?.id).toBe(13);
    expect(result.current.result?.stderr).toMatch(/quá lâu/);
  });

  it("fallback: chạy xong đúng hạn thì không để timer treo", async () => {
    Object.defineProperty(AbortSignal, "timeout", { value: undefined, configurable: true });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ status: { id: 3, description: "Accepted" }, stdout: "1\n" })))
    );

    const { result } = renderHook(() => useCodeRunner());
    await act(async () => {
      await result.current.runCode(71, "print(1)", "");
    });

    expect(result.current.result?.status?.id).toBe(3);
    expect(vi.getTimerCount()).toBe(0);
  });
});