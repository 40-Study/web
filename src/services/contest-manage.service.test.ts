/**
 * contest-manage.service — body của duyệt/sửa giải. Backend (contest_admin_handler.go
 * `parseOptionalPrizes`): body rỗng hoặc không có "prizes" = GIỮ giải hiện có, còn `prizes: []` =
 * XOÁ HẾT giải. Gửi nhầm `[]` khi không định sửa giải sẽ âm thầm xoá giải (review m6/e1).
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.fn();
vi.mock("@/lib/api-client", () => ({ api: { request: (...args: unknown[]) => requestMock(...args) } }));

// eslint-disable-next-line import/first
import { contestManageService } from "./contest-manage.service";

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({ status: 200, data: { message: "ok", data: {} } });
});

describe("contestManageService.approve", () => {
  it("không truyền giải → KHÔNG gửi body (giữ giải hiện có)", async () => {
    await contestManageService.approve("c-1");
    const config = requestMock.mock.calls[0][0];
    expect(config).toMatchObject({ method: "POST", url: "/admin/contests/c-1/approve" });
    expect(config.data).toBeUndefined();
  });

  it("truyền giải → gửi đúng {prizes}", async () => {
    const prizes = [{ rank_from: 1, rank_to: 1, grant_certificate: true, voucher_id: "v-1" }];
    await contestManageService.approve("c-1", prizes);
    expect(requestMock.mock.calls[0][0].data).toEqual({ prizes });
  });
});

describe("contestManageService lỗi nghiệp vụ", () => {
  it("403 giữ code CONTEST_FORBIDDEN (không bị interceptor đổi thành FORBIDDEN)", async () => {
    requestMock.mockResolvedValue({ status: 403, data: { message: "x", code: "CONTEST_FORBIDDEN" } });
    await expect(contestManageService.remove("c-1")).rejects.toMatchObject({ status: 403, code: "CONTEST_FORBIDDEN" });
  });

  it("409 chốt lỗi voucher giữ `details` của body (ĐÍNH CHÍNH 3)", async () => {
    const details = { user_id: "u-1", user_name: "Nguyễn An", rank: 2, voucher_id: "v-1", voucher_code: "GIAI1", reason: "hết lượt" };
    requestMock.mockResolvedValue({
      status: 409,
      data: { message: "Không phát được voucher", code: "CONTEST_VOUCHER_UNAVAILABLE", details },
    });
    await expect(contestManageService.finalize("c-1")).rejects.toMatchObject({
      code: "CONTEST_VOUCHER_UNAVAILABLE",
      payload: details,
    });
  });
});
