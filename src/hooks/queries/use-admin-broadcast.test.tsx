/**
 * QA 261009 M2 (follow-up): Idempotency-Key của lần gửi broadcast.
 * 409 IDEMPOTENCY_IN_PROGRESS = lần gửi đầu vẫn đang chạy -> PHẢI dùng lại key, nếu không lần thử lại
 * tạo ra thông báo trùng. 4xx khác = server từ chối trước khi gửi -> key mới.
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ApiError } from "@/lib/errors";
import { notificationService, type BroadcastRequest } from "@/services/notification.service";
import { createWrapper } from "@/test-utils/query-wrapper";
import { useSendBroadcast } from "./use-admin-broadcast";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const BODY: BroadcastRequest = { audience: "all", notification_type: "system", title: "T", content: "M" };

let uuidCounter = 0;
beforeEach(() => {
  vi.mocked(toast.error).mockClear();
  vi.mocked(toast.success).mockClear();
  vi.restoreAllMocks();
  uuidCounter = 0;
  vi.spyOn(crypto, "randomUUID").mockImplementation(() => `key-${++uuidCounter}` as ReturnType<typeof crypto.randomUUID>);
});

/** Gửi `BODY` hai lần liên tiếp; lần 1 thất bại với `first`, lần 2 thành công. Trả về hai key đã gửi. */
async function sendTwice(first: unknown) {
  const send = vi
    .spyOn(notificationService, "sendBroadcast")
    .mockRejectedValueOnce(first)
    .mockResolvedValue({ recipient_count: 3 } as Awaited<ReturnType<typeof notificationService.sendBroadcast>>);
  const { result } = renderHook(() => useSendBroadcast(), { wrapper: createWrapper() });

  act(() => result.current.mutate(BODY));
  await waitFor(() => expect(result.current.isError).toBe(true));
  act(() => result.current.mutate(BODY));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  return send.mock.calls.map((call) => call[1]);
}

describe("useSendBroadcast — Idempotency-Key", () => {
  it("409 IDEMPOTENCY_IN_PROGRESS: giữ nguyên key và báo đang gửi", async () => {
    const keys = await sendTwice(new ApiError(409, "IDEMPOTENCY_IN_PROGRESS", "in progress"));
    expect(keys).toEqual(["key-1", "key-1"]);
    expect(toast.error).toHaveBeenCalledWith("Thông báo đang được gửi, vui lòng đợi");
  });

  it("503: giữ nguyên key (kết quả không rõ ràng)", async () => {
    const keys = await sendTwice(new ApiError(503, "IDEMPOTENCY_UNAVAILABLE", "x"));
    expect(keys).toEqual(["key-1", "key-1"]);
  });

  it("4xx khác (400): key mới cho lần gửi sau", async () => {
    const keys = await sendTwice(new ApiError(400, "ERR_VALIDATION", "bad"));
    expect(keys).toEqual(["key-1", "key-2"]);
  });

  it("409 mã khác (không phải IN_PROGRESS): key mới", async () => {
    const keys = await sendTwice(new ApiError(409, "SOMETHING_ELSE", "x"));
    expect(keys).toEqual(["key-1", "key-2"]);
  });

  it("thành công: key mới cho lần gửi tiếp theo", async () => {
    const send = vi
      .spyOn(notificationService, "sendBroadcast")
      .mockResolvedValue({ recipient_count: 3 } as Awaited<ReturnType<typeof notificationService.sendBroadcast>>);
    const { result } = renderHook(() => useSendBroadcast(), { wrapper: createWrapper() });
    act(() => result.current.mutate(BODY));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    act(() => result.current.mutate(BODY));
    await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
    expect(send.mock.calls.map((c) => c[1])).toEqual(["key-1", "key-2"]);
  });
});
