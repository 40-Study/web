/**
 * Review #34 MINOR: nhánh 409 ERR_ORDER_IN_PROGRESS (toast + "Xem đơn hàng") trước đây không có
 * test, mutation thay điều kiện bằng `false` vẫn xanh. Kèm nhánh 409 ERR_ORDER_EXPIRED mới của
 * payment-intent (review backend #76 MAJOR 2).
 */

import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/errors";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@/services/order.service", () => ({
  orderService: { createOrder: vi.fn(), createPaymentIntent: vi.fn() },
}));

import { toast } from "sonner";
import { orderService } from "@/services/order.service";
import { orderKeys, useCreateOrder, useCreatePaymentIntent } from "./use-orders";

function setup() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(qc, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
  return { wrapper, invalidate };
}

const IN_PROGRESS_MSG = "Bạn đang có đơn hàng chưa thanh toán cho khoá học này.";
const EXPIRED_MSG = "Đơn hàng đã hết hạn giữ chỗ. Vui lòng tạo đơn mới để thanh toán theo giá hiện tại.";

describe("useCreateOrder — lỗi 409", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(orderService.createOrder).mockReset();
  });

  it("ERR_ORDER_IN_PROGRESS: toast message backend kèm nút 'Xem đơn hàng' dẫn tới /orders", async () => {
    vi.mocked(orderService.createOrder).mockRejectedValue(new ApiError(409, "ERR_ORDER_IN_PROGRESS", IN_PROGRESS_MSG));
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => result.current.mutate({ source: "buy_now", course_ids: ["c1"], idempotency_key: "k" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));

    const [message, options] = vi.mocked(toast.error).mock.calls[0] as [string, { action?: { label: string; onClick: () => void } }];
    expect(message).toBe(IN_PROGRESS_MSG);
    expect(options?.action?.label).toBe("Xem đơn hàng");
    options.action!.onClick();
    expect(assign).toHaveBeenCalledWith("/orders");
    vi.unstubAllGlobals();
  });

  it("lỗi khác: chỉ toast message, không có nút", async () => {
    vi.mocked(orderService.createOrder).mockRejectedValue(new ApiError(400, "ERR_CREATE_ORDER", "Khóa học không tồn tại"));
    const { wrapper } = setup();
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => result.current.mutate({ source: "buy_now", course_ids: ["c1"], idempotency_key: "k" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0]).toEqual(["Khóa học không tồn tại"]);
  });
});

describe("useCreatePaymentIntent — 409 ERR_ORDER_EXPIRED", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(orderService.createPaymentIntent).mockReset();
  });

  it("không toast trùng (hộp thanh toán tự báo) và làm mới danh sách đơn", async () => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(new ApiError(409, "ERR_ORDER_EXPIRED", EXPIRED_MSG));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useCreatePaymentIntent(), { wrapper });

    act(() => result.current.mutate({ id: "o1", data: { payment_method: "bank_transfer" } }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderKeys.mine() });
  });
});
