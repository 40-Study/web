/**
 * L5: timeout của runJudge0 chạy THẬT qua api-client (axios + interceptor thật), chỉ thay transport
 * (`api.defaults.adapter`). Từ 03ca2fa runJudge0 gọi backend `POST /submissions/execute` bằng axios, không
 * còn `fetch` + `AbortSignal.timeout`, nên test cũ (mock fetch) hỏng. Kiểm:
 * - request mang hạn chờ riêng 40s (dài hơn mặc định 15s của api-client), không treo nút Run mãi;
 * - transport hết hạn -> kết quả lỗi id 13, KHÔNG Accepted, nút Run nhả ra;
 * - chạy xong đúng hạn -> Accepted, không để timer treo.
 */
import { act, renderHook } from "@testing-library/react";
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/lib/api-client";
import { useCodeRunner } from "./useCodeRunner";

const JUDGE_TIMEOUT_MS = 40_000;
const PYTHON_ID = 71;

/**
 * Transport treo: chỉ kết thúc khi hết `config.timeout`, bằng đúng lỗi adapter xhr của axios ném khi timeout
 * (AxiosError ECONNABORTED, không có `response`).
 */
function hangingAdapter() {
  const calls: InternalAxiosRequestConfig[] = [];
  const adapter: AxiosAdapter = (config) => {
    calls.push(config);
    return new Promise((_resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new AxiosError(
              `timeout of ${config.timeout}ms exceeded`,
              AxiosError.ECONNABORTED,
              config
            )
          ),
        config.timeout
      );
    });
  };
  return { adapter, calls };
}

function okAdapter(): AxiosAdapter {
  return async (config) => ({
    status: 200,
    statusText: "OK",
    headers: {},
    config,
    data: { stdout: "1\n", stderr: "", exit_code: 0, time: "0.01", memory: 1024 },
  });
}

/** Chạy runCode, trả hook + promise còn chờ. */
function startRun() {
  const hook = renderHook(() => useCodeRunner());
  let pending!: Promise<void>;
  act(() => {
    pending = hook.result.current.runCode(PYTHON_ID, "print(1)", "");
  });
  return { hook, pending: () => pending };
}

/** Đẩy timer tới hết hạn chờ của request và đợi runCode kết thúc. */
async function runUntilTimeout() {
  const run = startRun();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(JUDGE_TIMEOUT_MS);
    await run.pending();
  });
  return run.hook.result.current;
}

describe("runJudge0 qua useCodeRunner — timeout (api-client thật)", () => {
  const originalAdapter = api.defaults.adapter;

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
    vi.useRealTimers();
  });

  it("request /submissions/execute mang hạn 40s; hết hạn -> lỗi id 13, không Accepted, nút Run nhả", async () => {
    const { adapter, calls } = hangingAdapter();
    api.defaults.adapter = adapter;

    const run = startRun();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("/submissions/execute");
    expect(calls[0].method).toBe("post");
    expect(calls[0].timeout).toBe(JUDGE_TIMEOUT_MS);
    expect(JSON.parse(calls[0].data as string)).toEqual({ language: "python", code: "print(1)", stdin: "" });
    expect(run.hook.result.current.running).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(JUDGE_TIMEOUT_MS - 1);
    });
    expect(run.hook.result.current.running).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
      await run.pending();
    });
    const r = run.hook.result.current;
    expect(r.running).toBe(false);
    expect(r.result?.status?.id).toBe(13);
    expect(r.result?.status?.description).not.toBe("Accepted");
    expect(r.result?.stdout).toBeUndefined();
  });

  // LỖI ĐÃ BIẾT (từ 03ca2fa) — test GHIM đúng hành vi sai hiện tại: interceptor của api-client đổi mọi lỗi
  // không có `response` (kể cả timeout ECONNABORTED) thành NetworkError, nên useCodeRunner (chỉ coi
  // TimeoutError/AbortError là timeout) báo "Không kết nối được máy chạy mã" thay vì "phản hồi quá lâu".
  // Khi ai đó sửa (api-client giữ dấu hiệu timeout, hoặc useCodeRunner nhận ra nó) test này ĐỎ: khi đó
  // ĐẢO nó thành assert /quá lâu/, không ghim lại.
  it("LỖI ĐÃ BIẾT (ghim): timeout qua api-client hiện bị báo là lỗi kết nối, chưa phải 'quá lâu'", async () => {
    api.defaults.adapter = hangingAdapter().adapter;
    const r = await runUntilTimeout();
    const stale =
      "Ghim đã cũ: timeout giờ không còn bị báo là lỗi kết nối. Nếu thông báo là 'quá lâu' thì lỗi đã được sửa — " +
      "ĐẢO test thành expect(stderr).toMatch(/quá lâu/); đừng ghim lại theo thông báo mới.";
    expect(r.result?.status?.id).toBe(13);
    expect(r.result?.stderr, stale).toMatch(/Không kết nối/);
    expect(r.result?.stderr, stale).not.toMatch(/quá lâu/);
  });

  it("chạy xong đúng hạn -> Accepted, không để timer treo", async () => {
    api.defaults.adapter = okAdapter();

    const { result } = renderHook(() => useCodeRunner());
    await act(async () => {
      await result.current.runCode(PYTHON_ID, "print(1)", "");
    });

    expect(result.current.result?.status).toEqual({ id: 3, description: "Accepted" });
    expect(result.current.result?.stdout).toBe("1\n");
    expect(result.current.running).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
