/**
 * Q10-STU-04: hết hạn mức mời phụ huynh trong ngày. Hộp thoại phải nói đúng lý do backend trả (không phải câu chung
 * "Có lỗi xảy ra khi gửi lời mời") và không đưa nút "Thử lại" vô nghĩa (gửi lại chắc chắn lại lỗi trong 24 giờ).
 * Http layer ném `ApiError`, không phải lỗi axios `response.data.message`.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mutateAsync = vi.fn();
vi.mock("@/hooks/queries/use-invitation", () => ({
  useInviteParent: () => ({ mutateAsync, isPending: false }),
  useSentInvitations: () => ({ data: [] }),
  invitationKeys: { sent: () => ["invitations", "sent"] },
}));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));

import { InviteParentModal } from "./invite-parent-modal";
import { ApiError, INVITATION_DAILY_LIMIT_CODE } from "@/lib/errors";
import { api } from "@/lib/api-client";
import { AxiosError, type InternalAxiosRequestConfig } from "axios";

const LIMIT_MESSAGE = "Bạn đã đạt giới hạn gửi lời mời phụ huynh trong ngày. Vui lòng thử lại sau 24 giờ.";

async function submitInvite(error: unknown) {
  mutateAsync.mockRejectedValueOnce(error);
  render(<InviteParentModal isOpen onClose={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Email phụ huynh"), { target: { value: "ph@example.com" } });
  fireEvent.click(screen.getByRole("button", { name: /Gửi lời mời/ }));
  await screen.findByText("Không thể gửi lời mời");
}

beforeEach(() => mutateAsync.mockReset());

describe("InviteParentModal — lỗi gửi lời mời (Q10-STU-04)", () => {
  it("hết hạn mức (400): hiện đúng câu của backend, chỉ có 'Đóng', không có 'Thử lại'", async () => {
    await submitInvite(new ApiError(400, "BAD_REQUEST", LIMIT_MESSAGE));
    expect(screen.getByText(LIMIT_MESSAGE)).toBeTruthy();
    expect(screen.queryByText("Có lỗi xảy ra khi gửi lời mời")).toBeNull();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeTruthy();
  });

  it("tính năng đang tắt (403): hiện câu của backend, không có 'Thử lại'", async () => {
    await submitInvite(new ApiError(403, "ERR_FEATURE_DISABLED", "Tính năng mời phụ huynh đang tạm tắt."));
    expect(screen.getByText("Tính năng mời phụ huynh đang tạm tắt.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("lỗi tạm (5xx): vẫn có 'Thử lại' quay về form, kèm câu chung", async () => {
    await submitInvite(new ApiError(500, "UNKNOWN", "Có lỗi xảy ra, vui lòng thử lại"));
    fireEvent.click(screen.getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(screen.getByLabelText("Email phụ huynh")).toBeTruthy());
  });

  // Q10 #148 M1: backend mới trả 429 + code ổn định; web quyết định theo code, không theo câu chữ.
  it("hết hạn mức (429 + ERR_INVITATION_DAILY_LIMIT): không có 'Thử lại', hiện đúng câu của backend", async () => {
    await submitInvite(new ApiError(429, INVITATION_DAILY_LIMIT_CODE, LIMIT_MESSAGE));
    expect(screen.getByText(LIMIT_MESSAGE)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("hết hạn mức theo CODE dù câu chữ đổi hẳn (không còn chữ 'giới hạn'): vẫn không có 'Thử lại'", async () => {
    await submitInvite(new ApiError(429, INVITATION_DAILY_LIMIT_CODE, "Hôm nay bạn đã mời đủ 10 người rồi."));
    expect(screen.getByText("Hôm nay bạn đã mời đủ 10 người rồi.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("quyết định theo CODE chứ không theo status: code hạn mức + status 400 + câu chữ lạ vẫn là cuối cùng", async () => {
    await submitInvite(new ApiError(400, INVITATION_DAILY_LIMIT_CODE, "Hôm nay bạn đã mời đủ rồi."));
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("mọi 429 là cuối cùng, kể cả không có code", async () => {
    await submitInvite(new ApiError(429, "UNKNOWN", "Quá nhiều yêu cầu"));
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
  });

  it("400 có code ERR_* khác mà trong câu có chữ 'giới hạn': KHÔNG coi là hết hạn mức, vẫn có 'Thử lại'", async () => {
    await submitInvite(new ApiError(400, "ERR_VALIDATION", "Lời nhắn vượt giới hạn 500 ký tự."));
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });
});

// Q11-PG-01 / Q11-STU-02: lỗi đi qua CLIENT THẬT (interceptor), không dựng tay ApiError. Trước đây mọi 429 bị dẹt thành
// RateLimitError "đợi một chút", nên code hạn mức không bao giờ tới modal.
describe("InviteParentModal — 429 qua api-client thật (Q11-PG-01)", () => {
  it("hiện câu 24 giờ của backend, không có 'Thử lại', không có câu 'đợi một chút'", async () => {
    const realError = await api
      .post("/invitations/invite", {}, {
        adapter: async (config: InternalAxiosRequestConfig) =>
          Promise.reject(
            new AxiosError("limit", "ERR_BAD_REQUEST", config, undefined, {
              status: 429,
              statusText: "429",
              headers: {},
              config,
              data: { code: INVITATION_DAILY_LIMIT_CODE, message: LIMIT_MESSAGE },
            })
          ),
      })
      .catch((e: unknown) => e);

    await submitInvite(realError);
    expect(screen.getByText(LIMIT_MESSAGE)).toBeTruthy();
    expect(screen.queryByText(/đợi một chút/)).toBeNull();
    expect(screen.queryByRole("button", { name: "Thử lại" })).toBeNull();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeTruthy();
  });
});
