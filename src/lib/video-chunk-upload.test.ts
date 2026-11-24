/** Q4-T09: PUT phần video có hạn chờ, lỗi mạng hiện câu tiếng Việt thay vì "Failed to fetch". */
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./errors";
import {
  putVideoChunk,
  UPLOAD_FAILED_MESSAGE,
  UPLOAD_TIMEOUT_MESSAGE,
  UPLOAD_UNREACHABLE_MESSAGE,
  videoUploadErrorMessage,
} from "./video-chunk-upload";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("putVideoChunk", () => {
  it("trả ETag của MinIO khi PUT thành công", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200, headers: { ETag: '"abc"' } })));
    await expect(putVideoChunk("http://x", new Blob(["a"]), 1)).resolves.toBe('"abc"');
  });

  it("huỷ PUT treo sau hạn chờ và báo bằng tiếng Việt", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
      ),
    );
    const pending = putVideoChunk("http://172.18.0.4:9000/x", new Blob(["a"]), 1, 1000);
    const assertion = expect(pending).rejects.toThrow(UPLOAD_TIMEOUT_MESSAGE);
    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
  });

  it("không kết nối được máy chủ lưu trữ: câu tiếng Việt, không phải 'Failed to fetch'", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await expect(putVideoChunk("http://x", new Blob(["a"]), 1)).rejects.toThrow(UPLOAD_UNREACHABLE_MESSAGE);
  });

  it("MinIO trả lỗi HTTP: câu tiếng Việt kèm mã", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 403 })));
    await expect(putVideoChunk("http://x", new Blob(["a"]), 1)).rejects.toThrow(`${UPLOAD_FAILED_MESSAGE} (mã 403)`);
  });
});

describe("videoUploadErrorMessage", () => {
  it("không bao giờ in chuỗi tiếng Anh thô", () => {
    expect(videoUploadErrorMessage(new TypeError("Failed to fetch"))).toBe(UPLOAD_UNREACHABLE_MESSAGE);
    expect(videoUploadErrorMessage(new Error("Something broke"))).toBe(UPLOAD_FAILED_MESSAGE);
    expect(videoUploadErrorMessage(new ApiError(400, "ERR_X", "bad chunk"))).not.toContain("bad chunk");
  });

  it("giữ câu tiếng Việt đã có", () => {
    expect(videoUploadErrorMessage(new Error("Không lấy được presigned URL"))).toBe("Không lấy được presigned URL");
  });
});
