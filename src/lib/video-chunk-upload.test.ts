/** Q4-T09: PUT phần video dừng khi không có tiến độ, huỷ được, lỗi mạng hiện câu tiếng Việt thay vì "Failed to fetch". */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FakeXhr } from "@/test/fake-xhr";
import { ApiError } from "./errors";
import {
  putVideoChunk,
  UPLOAD_CANCELLED_MESSAGE,
  UPLOAD_FAILED_MESSAGE,
  UPLOAD_TIMEOUT_MESSAGE,
  UPLOAD_UNREACHABLE_MESSAGE,
  VideoUploadCancelledError,
  videoUploadErrorMessage,
} from "./video-chunk-upload";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("putVideoChunk", () => {
  beforeEach(() => {
    FakeXhr.reset();
    vi.stubGlobal("XMLHttpRequest", FakeXhr);
  });
  const lastXhr = () => FakeXhr.instances[FakeXhr.instances.length - 1];

  it("PUT phần video, trả ETag của MinIO khi thành công", async () => {
    const pending = putVideoChunk("http://x", new Blob(["a"]), 1);
    expect(lastXhr().method).toBe("PUT");
    lastXhr().respond(200, { ETag: '"abc"' });
    await expect(pending).resolves.toBe('"abc"');
  });

  it("không có tiến độ quá hạn chờ: huỷ PUT và báo bằng tiếng Việt", async () => {
    vi.useFakeTimers();
    const pending = putVideoChunk("http://172.18.0.4:9000/x", new Blob(["a"]), 1, { stallTimeoutMs: 1000 });
    const assertion = expect(pending).rejects.toThrow(UPLOAD_TIMEOUT_MESSAGE);
    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
    expect(lastXhr().aborted).toBe(true);
  });

  it("mạng chậm nhưng còn tiến độ: không bị cắt dù tổng thời gian vượt hạn chờ", async () => {
    vi.useFakeTimers();
    const pending = putVideoChunk("http://x", new Blob(["a"]), 1, { stallTimeoutMs: 1000 });
    for (let i = 0; i < 5; i++) {
      await vi.advanceTimersByTimeAsync(800);
      lastXhr().progress();
    }
    lastXhr().respond(200, { ETag: '"slow"' });
    await expect(pending).resolves.toBe('"slow"');
    expect(lastXhr().aborted).toBe(false);
  });

  it("bấm huỷ: dừng PUT và trả lỗi huỷ (không phải lỗi mạng)", async () => {
    const controller = new AbortController();
    const pending = putVideoChunk("http://x", new Blob(["a"]), 1, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toBeInstanceOf(VideoUploadCancelledError);
    await expect(pending).rejects.toThrow(UPLOAD_CANCELLED_MESSAGE);
    expect(lastXhr().aborted).toBe(true);
  });

  it("đã huỷ từ trước: không gửi request nào", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(putVideoChunk("http://x", new Blob(["a"]), 1, { signal: controller.signal })).rejects.toBeInstanceOf(
      VideoUploadCancelledError,
    );
    expect(FakeXhr.instances).toHaveLength(0);
  });

  it("không kết nối được máy chủ lưu trữ: câu tiếng Việt, không phải 'Failed to fetch'", async () => {
    const pending = putVideoChunk("http://x", new Blob(["a"]), 1);
    lastXhr().failNetwork();
    await expect(pending).rejects.toThrow(UPLOAD_UNREACHABLE_MESSAGE);
  });

  it("MinIO trả lỗi HTTP: câu tiếng Việt kèm mã", async () => {
    const pending = putVideoChunk("http://x", new Blob(["a"]), 1);
    lastXhr().respond(403);
    await expect(pending).rejects.toThrow(`${UPLOAD_FAILED_MESSAGE} (mã 403)`);
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
