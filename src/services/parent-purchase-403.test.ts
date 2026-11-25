/**
 * Q6-PG-01 (contract C6, review M1): backend trả 403 `ERR_PARENT_CANNOT_PURCHASE` khi vai ĐANG CHỌN là Phụ huynh gọi
 * đăng ký / thêm giỏ / tạo đơn / payment-intent / check-payment. Interceptor chung đổi mọi 403 thành ForbiddenError
 * code cứng "FORBIDDEN" và làm rơi mã; năm lời gọi này phải đi qua businessRequest để giữ mã và dịch đúng câu.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ api: { request: vi.fn() } }));

import { api } from "@/lib/api-client";
import { rebuyRetryMessage } from "@/hooks/queries/use-orders";
import { getErrorMessage } from "@/lib/error-messages";
import { ApiError } from "@/lib/errors";
import { cartService } from "./cart.service";
import { enrollmentService } from "./enrollment.service";
import { orderService } from "./order.service";

const CODE = "ERR_PARENT_CANNOT_PURCHASE";
const MAPPED = "Tài khoản phụ huynh không thể đăng ký hoặc mua khoá học cho chính mình. Hãy chuyển sang vai học viên.";

const respond = (status: number, data: unknown) =>
  vi.mocked(api.request).mockResolvedValue({ status, data, headers: {} } as never);

const calls: Array<[string, () => Promise<unknown>]> = [
  ["enrollmentService.enroll", () => enrollmentService.enroll("c1")],
  ["cartService.addToCart", () => cartService.addToCart("c1")],
  ["orderService.createOrder", () => orderService.createOrder({ course_ids: ["c1"] } as never)],
  ["orderService.createPaymentIntent", () => orderService.createPaymentIntent("o1", { payment_method: "bank_transfer" } as never)],
  ["orderService.checkPayment", () => orderService.checkPayment("o1")],
];

beforeEach(() => vi.mocked(api.request).mockReset());

describe("403 ERR_PARENT_CANNOT_PURCHASE giữ mã và có câu tiếng Việt", () => {
  it.each(calls)("%s: lỗi mang code gốc, không phải FORBIDDEN", async (_name, call) => {
    respond(403, { message: "parent cannot purchase", code: CODE });
    const err = (await call().then(
      () => null,
      (e: unknown) => e
    )) as ApiError | null;
    expect(err).toBeInstanceOf(ApiError);
    expect(err?.status).toBe(403);
    expect(err?.code).toBe(CODE);
  });

  it.each(calls)("%s: người dùng thấy câu đã dịch ngay cả khi message backend là tiếng Anh", async (_name, call) => {
    respond(403, { message: "parent cannot purchase", code: CODE });
    const err = await call().then(
      () => null,
      (e: unknown) => e
    );
    expect(getErrorMessage(err)).toBe(MAPPED);
  });
});

describe("đường thành công không đổi hình dạng dữ liệu", () => {
  it("enroll / addToCart bóc phong bì {message, data}", async () => {
    respond(200, { message: "ok", data: { id: "e1", course_id: "c1" } });
    await expect(enrollmentService.enroll("c1")).resolves.toEqual({ id: "e1", course_id: "c1" });
    respond(200, { message: "ok", data: { id: "i1", course_id: "c1" } });
    await expect(cartService.addToCart("c1")).resolves.toMatchObject({ id: "i1", course_id: "c1" });
  });

  it("/orders/* KHÔNG có phong bì: trả nguyên body", async () => {
    respond(201, { id: "o1", status: "pending" });
    await expect(orderService.createOrder({ course_ids: ["c1"] } as never)).resolves.toEqual({ id: "o1", status: "pending" });
    respond(200, { status: "processing" });
    await expect(orderService.checkPayment("o1")).resolves.toEqual({ status: "processing" });
  });
});

describe("409 ERR_PAYMENT_VERIFYING vẫn mang retry_after_at tới tầng hiển thị (QA5 S5-03)", () => {
  it("createOrder: responseBody giữ nguyên body lỗi nên rebuyRetryMessage đọc được", async () => {
    const at = "2026-11-30T09:15:00Z";
    respond(409, { code: "ERR_PAYMENT_VERIFYING", message: "Đơn trước đang đối chiếu", retry_after_at: at });
    const err = await orderService.createOrder({ course_ids: ["c1"] } as never).then(
      () => null,
      (e: unknown) => e
    );
    expect((err as ApiError).responseBody?.retry_after_at).toBe(at);
    expect(rebuyRetryMessage(err, new Date("2026-11-30T00:00:00Z"))).toMatch(/^Đơn trước của bạn đã huỷ\. Có thể mua lại sau /);
  });
});
