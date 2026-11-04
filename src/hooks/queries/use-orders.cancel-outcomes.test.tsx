/**
 * Backend#143 Q8: 4 kết quả của POST /orders/:id/cancel trên đơn đang chờ chuyển khoản.
 *  - ngân hàng xác nhận có tiền khớp          -> 409 ERR_ORDER_ALREADY_PAID
 *  - ngân hàng không trả lời, chưa báo CK     -> 200 (huỷ được)
 *  - ngân hàng không trả lời, ĐÃ báo CK       -> 503 ERR_PAYMENT_PROVIDER_UNAVAILABLE
 *  - ngân hàng trả lời nhưng ân hạn/sai tiền  -> 409 ERR_PAYMENT_VERIFYING
 * Mỗi kết quả một câu riêng; không câu nào nói "đang đối chiếu" với người chưa từng chuyển khoản.
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";
import { createWrapper } from "@/test-utils/query-wrapper";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() }));
vi.mock("sonner", () => ({ toast }));
vi.mock("@/services/order.service", () => ({ orderService: { cancelOrder: vi.fn() } }));

import { orderService } from "@/services/order.service";
import {
  CANCEL_ALREADY_PAID_MESSAGE,
  CANCEL_PROVIDER_UNAVAILABLE_MESSAGE,
  CANCEL_VERIFYING_MESSAGE,
  cancelOrderErrorMessage,
  useCancelOrder,
} from "./use-orders";

async function cancelWith(outcome: "ok" | ApiError) {
  const cancel = vi.mocked(orderService.cancelOrder);
  if (outcome === "ok") cancel.mockResolvedValue({} as never);
  else cancel.mockRejectedValue(outcome);
  const { result } = renderHook(() => useCancelOrder(), { wrapper: createWrapper() });
  await act(async () => {
    await result.current.mutateAsync("order-1").catch(() => undefined);
  });
  await waitFor(() => expect(result.current.isPending).toBe(false));
}

beforeEach(() => {
  Object.values(toast).forEach((fn) => fn.mockReset());
  vi.mocked(orderService.cancelOrder).mockReset();
});

describe("huỷ đơn — 4 kết quả", () => {
  it("200: toast thành công", async () => {
    await cancelWith("ok");
    expect(toast.success).toHaveBeenCalledWith("Đã huỷ đơn hàng");
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("409 ERR_ORDER_ALREADY_PAID: nói đơn đã thanh toán, là thông tin chứ không phải lỗi", async () => {
    await cancelWith(new ApiError(409, "ERR_ORDER_ALREADY_PAID", "Order already paid"));
    expect(toast.info).toHaveBeenCalledWith(CANCEL_ALREADY_PAID_MESSAGE);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("503 ERR_PAYMENT_PROVIDER_UNAVAILABLE: nói ngân hàng sự cố, đơn được giữ, thử lại sau", async () => {
    await cancelWith(new ApiError(503, "ERR_PAYMENT_PROVIDER_UNAVAILABLE", "bank down"));
    expect(toast.error).toHaveBeenCalledWith(CANCEL_PROVIDER_UNAVAILABLE_MESSAGE);
  });

  it("409 ERR_PAYMENT_VERIFYING: câu riêng của huỷ đơn", async () => {
    await cancelWith(new ApiError(409, "ERR_PAYMENT_VERIFYING", "verifying"));
    expect(toast.error).toHaveBeenCalledWith(CANCEL_VERIFYING_MESSAGE);
  });

  it("lỗi khác: giữ message tiếng Việt của backend", () => {
    expect(cancelOrderErrorMessage(new ApiError(400, "X", "Đơn không thể huỷ"), "fallback")).toBe("Đơn không thể huỷ");
    expect(cancelOrderErrorMessage(new Error("boom"), "Không thể huỷ đơn hàng")).toBe("Không thể huỷ đơn hàng");
  });

  it("không câu nào nói 'đang đối chiếu' (người chưa chuyển khoản cũng có thể nhận 409/503 này)", () => {
    for (const message of [CANCEL_ALREADY_PAID_MESSAGE, CANCEL_PROVIDER_UNAVAILABLE_MESSAGE, CANCEL_VERIFYING_MESSAGE]) {
      expect(message).not.toMatch(/đang đối chiếu/i);
    }
  });

  it("503 chỉ tính khi đúng mã: 503 mã khác không bị gán câu ngân hàng", () => {
    expect(cancelOrderErrorMessage(new ApiError(503, "OTHER", "Có lỗi xảy ra, vui lòng thử lại"), "f")).toBe(
      "Có lỗi xảy ra, vui lòng thử lại"
    );
  });
});
