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

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));
vi.mock("@/services/order.service", () => ({
  orderService: { createOrder: vi.fn(), createPaymentIntent: vi.fn(), cancelOrder: vi.fn(), checkPayment: vi.fn() },
}));

import { toast } from "sonner";
import { orderService } from "@/services/order.service";
import {
  BANK_UNAVAILABLE_NOTICE,
  PAYMENT_FINAL_CHECK_WINDOW_MS,
  nextPaymentPollDelay,
  orderKeys,
  useCancelOrder,
  useCheckPayment,
  useCreateOrder,
  useCreatePaymentIntent,
} from "./use-orders";

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

  // Review #76 vòng 3 (chặn đơn trùng khi đơn cũ đang đối chiếu): checkout/page.tsx và nút "Mua ngay"
  // ở course-detail-sidebar.tsx đều gọi mutateAsync KHÔNG kèm onError riêng, toast đến từ hook.
  it("mutateAsync (cách checkout và Mua ngay gọi): vẫn toast đúng 1 lần kèm 'Xem đơn hàng'", async () => {
    vi.mocked(orderService.createOrder).mockRejectedValue(new ApiError(409, "ERR_ORDER_IN_PROGRESS", IN_PROGRESS_MSG));
    const { wrapper } = setup();
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    await act(async () => {
      await expect(result.current.mutateAsync({ source: "cart", course_ids: ["c1"], idempotency_key: "k" })).rejects.toThrow();
    });
    expect(toast.error).toHaveBeenCalledTimes(1);
    const [message, options] = vi.mocked(toast.error).mock.calls[0] as [string, { action?: { label: string } }];
    expect(message).toBe(IN_PROGRESS_MSG);
    expect(options?.action?.label).toBe("Xem đơn hàng");
  });

  // Review #76 vòng 4: đơn trước cùng khoá đã cấp mã, đang đối chiếu (kể cả vừa huỷ).
  it("ERR_PAYMENT_VERIFYING: toast câu backend kèm 'Xem đơn hàng'", async () => {
    const msg = "Đơn trước của bạn cho khoá học này đã được cấp mã chuyển khoản và đang được đối chiếu với ngân hàng.";
    vi.mocked(orderService.createOrder).mockRejectedValue(new ApiError(409, "ERR_PAYMENT_VERIFYING", msg));
    const { wrapper } = setup();
    const { result } = renderHook(() => useCreateOrder(), { wrapper });

    act(() => result.current.mutate({ source: "buy_now", course_ids: ["c1"], idempotency_key: "k" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    const [message, options] = vi.mocked(toast.error).mock.calls[0] as [string, { action?: { label: string } }];
    expect(message).toBe(msg);
    expect(options?.action?.label).toBe("Xem đơn hàng");
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

// Re-review #76 vòng 2: hết hạn mã chưa phải kết quả cuối, backend còn đối chiếu ngân hàng lần cuối.
describe("nextPaymentPollDelay", () => {
  const expiresAt = "2026-09-28T12:00:00Z";
  const at = (iso: string) => new Date(iso).getTime();

  it("vẫn poll sau hạn mã trong cửa sổ đối chiếu, dừng khi quá cửa sổ", () => {
    expect(nextPaymentPollDelay("processing", expiresAt, at("2026-09-28T11:59:00Z"))).toBe(5_000);
    expect(nextPaymentPollDelay("processing", expiresAt, at("2026-09-28T12:01:00Z"))).toBe(5_000);
    expect(nextPaymentPollDelay("processing", expiresAt, at("2026-09-28T12:00:00Z") + PAYMENT_FINAL_CHECK_WINDOW_MS + 1)).toBe(false);
  });

  it("dừng ngay khi server trả kết quả cuối", () => {
    expect(nextPaymentPollDelay("expired", expiresAt, at("2026-09-28T12:01:00Z"))).toBe(false);
    expect(nextPaymentPollDelay("completed", expiresAt, at("2026-09-28T11:00:00Z"))).toBe(false);
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

  it.each([
    ["ERR_ORDER_ALREADY_PAID", "Đơn hàng đã được thanh toán."],
    ["ERR_PAYMENT_VERIFYING", "Đơn hàng đang được đối chiếu thanh toán với ngân hàng."],
  ])("%s: hộp thanh toán tự hiện màn riêng, không toast", async (code, msg) => {
    vi.mocked(orderService.createPaymentIntent).mockRejectedValue(new ApiError(409, code, msg));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useCreatePaymentIntent(), { wrapper });

    act(() => result.current.mutate({ id: "o1", data: { payment_method: "bank_transfer" } }));
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.error).not.toHaveBeenCalled();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderKeys.mine() });
  });
});

// Review #76 vòng 3: backend đối chiếu ngân hàng trước khi huỷ đơn processing có mã.
describe("useCancelOrder — 409 do đối chiếu", () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockReset();
    vi.mocked(orderService.cancelOrder).mockReset();
  });

  it.each([
    ["ERR_PAYMENT_VERIFYING", "Đơn hàng đang được đối chiếu thanh toán với ngân hàng. Vui lòng không chuyển khoản lại và thử lại sau ít phút."],
    ["ERR_ORDER_ALREADY_PAID", "Đơn hàng đã được thanh toán, khóa học đã được thêm vào tài khoản của bạn."],
  ])("%s: toast câu của backend và làm mới đơn", async (code, msg) => {
    vi.mocked(orderService.cancelOrder).mockRejectedValue(new ApiError(409, code, msg));
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useCancelOrder(), { wrapper });

    act(() => result.current.mutate("o1"));
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(vi.mocked(toast.error).mock.calls[0]).toEqual([msg]);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderKeys.mine() });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: orderKeys.detail("o1") });
  });
});

// Review #76 final: ngân hàng lỗi ≠ chưa có giao dịch. useCheckPayment là chỗ DUY NHẤT toast "ngân
// hàng lỗi, thử lại sau" cho cả hộp thanh toán lẫn trang đơn hàng.
describe("useCheckPayment — bank_unavailable", () => {
  beforeEach(() => {
    vi.mocked(toast.warning).mockReset();
    vi.mocked(orderService.checkPayment).mockReset();
  });

  it("backend báo bank_unavailable: toast ngân hàng lỗi", async () => {
    vi.mocked(orderService.checkPayment).mockResolvedValue({ order_id: "o1", status: "processing", amount: 1, bank_unavailable: true });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCheckPayment(), { wrapper });
    act(() => result.current.mutate("o1"));
    await waitFor(() => expect(toast.warning).toHaveBeenCalledWith(BANK_UNAVAILABLE_NOTICE));
  });

  it("ngân hàng trả lời bình thường: không toast ngân hàng lỗi", async () => {
    vi.mocked(orderService.checkPayment).mockResolvedValue({ order_id: "o1", status: "cancelled", amount: 1 });
    const { wrapper } = setup();
    const { result } = renderHook(() => useCheckPayment(), { wrapper });
    act(() => result.current.mutate("o1"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(toast.warning).not.toHaveBeenCalled();
  });
});