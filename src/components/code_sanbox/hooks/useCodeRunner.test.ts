/**
 * L5-5: khi Judge0 lỗi (mạng, timeout, HTTP lỗi) hook KHÔNG được trả "Accepted" giả.
 * Kết quả phải mang trạng thái lỗi (id > 3, OutputPanel tô đỏ) và thông báo tiếng Việt.
 */
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/judgeApi", () => ({ runJudge0: vi.fn() }));

import { runJudge0 } from "../api/judgeApi";
import { useCodeRunner } from "./useCodeRunner";

const mocked = vi.mocked(runJudge0);

async function runAndGet() {
  const { result } = renderHook(() => useCodeRunner());
  await act(async () => {
    await result.current.runCode(71, "print(1)", "");
  });
  return result.current;
}

describe("useCodeRunner", () => {
  beforeEach(() => {
    mocked.mockReset();
  });

  it("Judge0 chạy được: trả nguyên kết quả", async () => {
    mocked.mockResolvedValue({ status: { id: 3, description: "Accepted" }, stdout: "1\n" });
    const r = await runAndGet();
    expect(r.result?.status?.id).toBe(3);
    expect(r.result?.stdout).toBe("1\n");
    expect(r.running).toBe(false);
  });

  it.each([
    ["lỗi mạng", () => new TypeError("Failed to fetch")],
    ["timeout", () => Object.assign(new Error("timeout"), { name: "TimeoutError" })],
    ["Judge0 trả HTTP lỗi", () => new Error("Judge0 error")],
  ])("%s: không trả Accepted giả, hiện trạng thái lỗi", async (_name, makeErr) => {
    mocked.mockImplementation(async () => {
      throw makeErr();
    });
    const r = await runAndGet();
    expect(r.running).toBe(false);
    expect(r.result?.status?.id).toBeGreaterThan(3); // > 3 => OutputPanel coi là lỗi
    expect(r.result?.status?.description).not.toBe("Accepted");
    expect(r.result?.stdout).toBeUndefined();
    expect(r.result?.stderr).toMatch(/[ạảãàáâăêôơưđ]/i); // thông báo tiếng Việt
  });

  it("timeout có thông báo riêng, khác lỗi mạng", async () => {
    mocked.mockImplementation(async () => {
      throw Object.assign(new Error("t"), { name: "TimeoutError" });
    });
    const timeout = (await runAndGet()).result?.stderr;
    mocked.mockImplementation(async () => {
      throw new TypeError("Failed to fetch");
    });
    const network = (await runAndGet()).result?.stderr;
    expect(timeout).not.toBe(network);
  });
});
